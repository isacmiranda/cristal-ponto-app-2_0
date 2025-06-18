import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PinPage() {
  const [pin, setPin] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [horaAtual, setHoraAtual] = useState('');
  const [temperatura, setTemperatura] = useState(null);
  const [iconeClima, setIconeClima] = useState('');
  const [fotoFuncionario, setFotoFuncionario] = useState('');
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
    const atualizarHora = () => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR'));
    };

    const buscarPrevisaoTempo = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63&current_weather=true');
        const data = await res.json();
        const { temperature, weathercode } = data.current_weather;
        setTemperatura(temperature);
        setIconeClima(weatherIcons[weathercode] || '🌡️');
      } catch (error) {
        console.error('Erro ao buscar previsão do tempo:', error);
      }
    };

    const buscarFuncionarios = async () => {
      try {
        const res = await fetch('https://backend-ponto-digital-1.onrender.com/api/funcionarios');
        const data = await res.json();
        setFuncionarios(data);
      } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
      }
    };

    atualizarHora();
    const intervalo = setInterval(atualizarHora, 1000);
    buscarPrevisaoTempo();
    buscarFuncionarios();

    return () => clearInterval(intervalo);
  }, [weatherIcons]);

  useEffect(() => {
    if (mensagem) {
      const timer = setTimeout(() => setMensagem(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [mensagem]);

  const registrarPonto = async () => {
    if (!pin || bloqueado) return;

    setBloqueado(true);
    const funcionario = funcionarios.find(f => f.pin === pin);

    if (!funcionario) {
      setMensagem('PIN inválido!');
      setFotoFuncionario('');
      setPin('');
      setBloqueado(false);
      return;
    }

    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const horario = agora.toLocaleTimeString('pt-BR');

    try {
      const res = await fetch(`https://backend-ponto-digital-1.onrender.com/api/registros/ultimo/${pin}`);
      const ultimoRegistro = await res.json();
      const tipo = !ultimoRegistro || !ultimoRegistro.tipo || ultimoRegistro.tipo === 'saida'
        ? 'entrada'
        : 'saida';

      await fetch('https://backend-ponto-digital-1.onrender.com/api/registros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          nome: funcionario.nome || '',
          data,
          horario,
          tipo
        })
      });

      setFotoFuncionario(funcionario.foto || '');
      setMensagem(tipo === 'entrada'
        ? `Bom trabalho, ${funcionario.nome || 'funcionário'}!`
        : `Até logo, ${funcionario.nome || 'funcionário'}!`
      );

      falarTexto(tipo);
      setPin('');
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      setMensagem('Erro ao registrar ponto!');
    } finally {
      setTimeout(() => setBloqueado(false), 2000);
    }
  };

  const falarTexto = (tipo) => {
    if (!('speechSynthesis' in window)) return;

    const texto = tipo === 'entrada' ? "Entrada registrada" : "Saída registrada";
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = 'pt-BR';
    utter.rate = 1;

    try {
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('Erro ao usar síntese de fala:', e);
    }
  };

  const handleTecla = (valor) => {
    if (valor === 'C') {
      setPin('');
      setMensagem('');
      setFotoFuncionario('');
    } else if (valor === 'OK') {
      if (pin) registrarPonto();
    } else {
      if (pin.length < 6) setPin(prev => prev + valor);
    }
  };

  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-500 text-white flex flex-col items-center justify-center px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Sistema de Ponto Cristal Acquacenter</h1>
        <p className="text-lg md:text-xl flex items-center justify-center gap-4">
          🕒 {horaAtual}
          {temperatura !== null && (
            <span>{iconeClima} {temperatura}°C</span>
          )}
        </p>
      </div>

      <div className="text-3xl md:text-4xl tracking-widest bg-white/20 py-3 px-8 rounded-xl mb-6">
        {pin.replace(/./g, '●')}
      </div>

      {fotoFuncionario && (
        <div className="mb-6 flex justify-center items-center">
          <img
            src={fotoFuncionario}
            alt="Foto do funcionário"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 max-w-[300px] sm:max-w-[360px] md:max-w-[400px]">
        {teclas.map((tecla, index) => (
          <button
            key={index}
            onClick={() => handleTecla(tecla)}
            disabled={bloqueado && tecla === 'OK'}
            className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 
              rounded-full font-bold text-xl sm:text-2xl shadow flex items-center justify-center
              ${tecla === 'OK' ? 'bg-green-600 text-white hover:bg-green-500' :
                tecla === 'C' ? 'bg-red-600 text-white hover:bg-red-500' :
                'bg-white text-blue-900 hover:bg-blue-100'}
              ${bloqueado && tecla === 'OK' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {tecla}
          </button>
        ))}
      </div>

      {mensagem && (
        <div className="mt-6 bg-white/20 text-white px-6 py-3 rounded-xl text-lg text-center max-w-xs sm:max-w-md">
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
