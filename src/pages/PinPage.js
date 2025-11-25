// import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';

export default function PinPage() {
  const [pin, setPin] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [horaAtual, setHoraAtual] = useState('');
  const [temperatura, setTemperatura] = useState(null);
  const [iconeClima, setIconeClima] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [mostrarTipo, setMostrarTipo] = useState(false);
  const [funcionarioAtual, setFuncionarioAtual] = useState(null);

  // 🔥 PRELOADER NOVO
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

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
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63&current_weather=true');
        const data = await res.json();
        const { temperature, weathercode } = data.current_weather;
        setTemperatura(temperature);
        setIconeClima(weatherIcons[weathercode] || '🌡️');
      } catch (err) {
        console.error('Erro ao buscar clima:', err);
      }
    };

    atualizarHora();
    const id = setInterval(atualizarHora, 1000);
    buscarPrevisaoTempo();

    const registrosSalvos = JSON.parse(localStorage.getItem('registros') || '[]');
    const funcionariosSalvos = JSON.parse(localStorage.getItem('funcionarios') || '[]');
    setRegistros(registrosSalvos);
    setFuncionarios(funcionariosSalvos);

    return () => clearInterval(id);
  }, [weatherIcons]);

  useEffect(() => {
    if (mensagem) {
      const t = setTimeout(() => setMensagem(''), 5000);
      return () => clearTimeout(t);
    }
  }, [mensagem]);

  const validarPin = () => {
    if (!pin || bloqueado) return;

    const funcionario = funcionarios.find(f => f.pin === pin);
    if (!funcionario) {
      setMensagem('PIN inválido!');
      setPin('');
      return;
    }

    setFuncionarioAtual(funcionario);
    setMostrarTipo(true);
  };

  const registrarPonto = (tipo) => {
    if (!funcionarioAtual) return;

    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const horario = agora.toLocaleTimeString('pt-BR');

    const novoRegistro = {
      pin,
      nome: funcionarioAtual.nome,
      data,
      horario,
      tipo,
    };

    const novosRegistros = [...registros, novoRegistro];
    setRegistros(novosRegistros);
    localStorage.setItem('registros', JSON.stringify(novosRegistros));

    let msg = '';
    switch (tipo) {
      case 'entrada':
        msg = `Bom trabalho, ${funcionarioAtual.nome}!`;
        break;
      case 'saida':
        msg = `Até logo, ${funcionarioAtual.nome}!`;
        break;
      case 'intervalo ida':
        msg = `Bom intervalo, ${funcionarioAtual.nome}!`;
        break;
      case 'intervalo volta':
        msg = `Bem-vindo de volta, ${funcionarioAtual.nome}!`;
        break;
      default:
        msg = `Registro realizado.`;
    }

    setMensagem(msg);
    falarTexto(tipo);
    playConfirmationSound();
    setPin('');
    setFuncionarioAtual(null);
    setMostrarTipo(false);
    setBloqueado(true);
    setTimeout(() => setBloqueado(false), 2000);
  };

  const falarTexto = (tipo) => {
    if (!('speechSynthesis' in window)) return;
    const textos = {
      entrada: 'Entrada registrada',
      saida: 'Saída registrada',
      'intervalo ida': 'Início de intervalo registrado',
      'intervalo volta': 'Retorno de intervalo registrado'
    };
    const texto = textos[tipo] || 'Registro realizado';
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-BR';
    u.rate = 1;
    try {
      speechSynthesis.speak(u);
    } catch (e) {
      console.warn('Erro ao sintetizar fala:', e);
    }
  };

  const playConfirmationSound = () => {
    const audio = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_6dbba87df3.mp3');
    audio.play().catch(e => console.warn('Erro ao tocar som:', e));
  };

  const handleTecla = (v) => {
    if (v === 'C') {
      setPin('');
      setMensagem('');
    } else if (v === 'OK') {
      validarPin();
    } else if (pin.length < 6) {
      setPin(p => p + v);
    }
  };

  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];

  // Preloader com animações
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-900">
        <div className="flex flex-col items-center animate-fade-in-out">
          <img
            src="/logo.png"
            alt="Logo Cristal Acquacenter"
            className="w-48 h-48 object-contain animate-scale-up"
          />

          <p className="text-white mt-6 text-xl font-semibold animate-pulse">
            Carregando...
          </p>
        </div>

        {/* ANIMAÇÕES */}
        <style>
          {`
            @keyframes scaleUp {
              0% { transform: scale(0.7); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes fadeInOut {
              0% { opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { opacity: 0; }
            }
            .animate-scale-up {
              animation: scaleUp 1.2s ease forwards;
            }
            .animate-fade-in-out {
              animation: fadeInOut 2s ease forwards;
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-500 text-white flex flex-col items-center justify-center px-4 py-6">

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4 flex-wrap mb-2">
          <img src="/logo.png" alt="Logo Cristal Acquacenter" className="w-14 h-14 md:w-16 md:h-16 object-contain" />
          <h1 className="text-2xl md:text-3xl font-bold">Sistema de Ponto Cristal Acquacenter</h1>
        </div>

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
              ${t === 'OK' ? 'bg-green-600' : t === 'C' ? 'bg-red-600' : 'bg-white text-blue-900'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {mensagem && (
        <div className="mt-6 bg-yellow-400 text-black px-6 py-3 rounded-xl text-lg text-center max-w-xs sm:max-w-md font-bold">
          {mensagem}
        </div>
      )}

      {mostrarTipo && (
        <div className="mt-6 bg-white/20 p-4 rounded-lg text-center">
          <h2 className="text-lg mb-2 font-bold">Selecione o tipo de registro:</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {['entrada', 'intervalo ida', 'intervalo volta', 'saida'].map(tipo => (
              <button
                key={tipo}
                onClick={() => registrarPonto(tipo)}
                className="bg-white text-blue-900 font-bold px-4 py-2 rounded-lg hover:bg-blue-200"
              >
                {tipo.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/login')}
        className="mt-6 bg-black/70 hover:bg-black text-white px-6 py-3 rounded-xl text-lg shadow-lg"
      >
        ⚙️ Área Admin
      </button>

      <footer className="text-white text-center py-2 text-sm shadow-md mt-10">
        Desenvolvido por <span className="font-semibold">Isac Miranda ©</span> - 2025
      </footer>
    </div>
  );
}
