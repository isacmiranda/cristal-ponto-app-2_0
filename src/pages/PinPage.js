import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PinPage() {
  const [pin, setPin] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [horaAtual, setHoraAtual] = useState('');
  const [temperatura, setTemperatura] = useState(null);
  const [iconeClima, setIconeClima] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);
  const [bloqueado, setBloqueado] = useState(false);

  const navigate = useNavigate();

  const weatherIcons = useMemo(() => ({
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌨️', 67: '🌨️',
    71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌧️', 81: '🌧️', 82: '🌧️'
  }), []);

  useEffect(() => {
    const atualizarHora = () => setHoraAtual(new Date().toLocaleTimeString('pt-BR'));

    const buscarPrevisaoTempo = async () => {
      try {
        const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: { latitude: -23.55, longitude: -46.63, current_weather: true }
        });
        const { temperature, weathercode } = res.data.current_weather;
        setTemperatura(temperature);
        setIconeClima(weatherIcons[weathercode] || '🌡️');
      } catch (err) {
        console.error('Erro ao buscar clima:', err);
      }
    };

    const buscarFuncionarios = async () => {
      try {
        const res = await axios.get('https://backend-ponto-digital-1.onrender.com/api/funcionarios');
        setFuncionarios(res.data);
      } catch (err) {
        console.error('Erro ao buscar funcionários:', err);
      }
    };

    atualizarHora();
    const id = setInterval(atualizarHora, 1000);
    buscarPrevisaoTempo();
    buscarFuncionarios();

    return () => clearInterval(id);
  }, [weatherIcons]);

  useEffect(() => {
    if (mensagem) {
      const t = setTimeout(() => setMensagem(''), 5000);
      return () => clearTimeout(t);
    }
  }, [mensagem]);

  const registrarPonto = async () => {
    if (!pin || bloqueado) return;

    setBloqueado(true);
    const func = funcionarios.find(f => f.pin === pin);

    if (!func) {
      setMensagem('PIN inválido!');
      setPin('');
      setBloqueado(false);
      return;
    }

    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const horario = agora.toLocaleTimeString('pt-BR');

    try {
      const resLast = await axios.get(
        `https://backend-ponto-digital-1.onrender.com/api/registros/ultimo/${pin}`
      );

      const ultimo = resLast.data;
      const tipo = !ultimo || ultimo.tipo === 'saida' ? 'entrada' : 'saida';

      await axios.post(
        'https://backend-ponto-digital-1.onrender.com/api/registros',
        { pin, nome: func.nome, data, horario, tipo }
      );

      setMensagem(tipo === 'entrada'
        ? `Bom trabalho, ${func.nome}!`
        : `Até logo, ${func.nome}!`
      );

      falarTexto(tipo);
      setPin('');

    } catch (err) {
      console.error('Erro ao registrar ponto:', err);
      setMensagem('Erro ao registrar ponto!');
    } finally {
      setTimeout(() => setBloqueado(false), 2000);
    }
  };

  const falarTexto = (tipo) => {
    if (!('speechSynthesis' in window)) return;
    const texto = tipo === 'entrada' ? 'Entrada registrada' : 'Saída registrada';
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-BR';
    u.rate = 1;
    try {
      speechSynthesis.speak(u);
    } catch (e) {
      console.warn('Erro ao sintetizar fala:', e);
    }
  };

  const handleTecla = (v) => {
    if (v === 'C') {
      setPin('');
      setMensagem('');
    } else if (v === 'OK') {
      registrarPonto();
    } else if (pin.length < 6) {
      setPin(p => p + v);
    }
  };

  const teclas = ['1','2','3','4','5','6','7','8','9','C','0','OK'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-500 text-white flex flex-col items-center justify-center px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Sistema de Ponto Cristal Acquacenter</h1>
        <p className="text-lg md:text-xl flex items-center gap-4 justify-center">
          🕒 {horaAtual}
          {temperatura !== null && <span>{iconeClima} {temperatura}°C</span>}
        </p>
      </div>

      <div className="text-3xl md:text-4xl tracking-widest bg-white/20 py-3 px-8 rounded-xl mb-6">
        {pin.replace(/./g, '●')}
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-[400px]">
        {teclas.map(t => (
          <button
            key={t}
            onClick={() => handleTecla(t)}
            disabled={bloqueado && t === 'OK'}
            className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full font-bold text-xl shadow flex items-center justify-center
              ${t === 'OK' ? 'bg-green-600' : t === 'C' ? 'bg-red-600' : 'bg-white text-blue-900'}
              ${bloqueado && t==='OK' ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-105'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {mensagem && (
        <div className="mt-6 bg-white/20 px-6 py-3 rounded-xl text-lg text-center max-w-xs sm:max-w-md">
          {mensagem}
        </div>
      )}

      <button
        onClick={() => navigate('/login')}
        className="mt-6 bg-black/70 hover:bg-black text-white px-6 py-3 rounded-xl text-lg shadow-lg"
      >
        ⚙️ Área Admin
      </button>
    </div>
  );
}
