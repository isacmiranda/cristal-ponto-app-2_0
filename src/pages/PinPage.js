import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Configuração da API
const API_BASE_URL = 'https://backend-ponto-digital-2.onrender.com';

export default function PinPage() {
  const [pin, setPin] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [horaAtual, setHoraAtual] = useState('');
  const [temperatura, setTemperatura] = useState(null);
  const [iconeClima, setIconeClima] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  const [mostrarTipo, setMostrarTipo] = useState(false);
  const [funcionarioAtual, setFuncionarioAtual] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [statusConexao, setStatusConexao] = useState('Conectando...');
  const [ultimoRegistro, setUltimoRegistro] = useState(null);

  const navigate = useNavigate();

  const weatherIcons = useMemo(() => ({
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌨️', 67: '🌨️',
    71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌧️', 81: '🌧️', 82: '🌧️'
  }), []);

  // Preloader (3 segundos)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Monitorar status da conexão
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setStatusConexao('✅ Online');
      sincronizarPendentes();
    };
    
    const handleOffline = () => {
      setOnline(false);
      setStatusConexao('⚠️ Offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Testar conexão inicial
    testarConexaoBackend();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Atualizar hora e clima
  useEffect(() => {
    const atualizarHora = () => {
      const agora = new Date();
      setHoraAtual(agora.toLocaleTimeString('pt-BR'));
    };

    const buscarPrevisaoTempo = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63&current_weather=true');
        const data = await res.json();
        const { temperature, weathercode } = data.current_weather;
        setTemperatura(temperature);
        setIconeClima(weatherIcons[weathercode] || '🌡️');
      } catch (err) {
        console.log('Clima não disponível');
      }
    };

    atualizarHora();
    const id = setInterval(atualizarHora, 1000);
    buscarPrevisaoTempo();

    return () => clearInterval(id);
  }, [weatherIcons]);

  // Testar conexão com backend
  const testarConexaoBackend = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { timeout: 5000 });
      if (response.ok) {
        setStatusConexao('✅ Online');
        setOnline(true);
      } else {
        setStatusConexao('⚠️ Backend indisponível');
      }
    } catch (error) {
      setStatusConexao('❌ Sem conexão');
      setOnline(false);
    }
  };

  // Validar PIN
  const validarPin = async () => {
    if (!pin || bloqueado) return;
    
    if (pin.length < 4) {
      setMensagem('PIN deve ter pelo menos 4 dígitos');
      return;
    }

    setMensagem('Validando...');
    setBloqueado(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/funcionarios/verificar-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin })
      });

      const data = await response.json();
      
      if (data.valido) {
        setFuncionarioAtual({
          _id: data.funcionario.id,
          nome: data.funcionario.nome,
          cargo: data.funcionario.cargo,
          pin: pin
        });
        setMostrarTipo(true);
        setMensagem(`✅ Olá, ${data.funcionario.nome}!`);
      } else {
        setMensagem(data.mensagem || 'PIN inválido');
        setPin('');
      }
    } catch (error) {
      setMensagem('❌ Servidor indisponível');
      setOnline(false);
    } finally {
      setBloqueado(false);
    }
  };

  // Registrar ponto (versão otimizada)
  const registrarPonto = async (tipo) => {
    if (!funcionarioAtual) return;

    setBloqueado(true);
    setMensagem('Registrando...');

    const registroData = {
      pin: pin,
      tipo: tipo,
      horario: new Date().toISOString()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/registros/bater-ponto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registroData)
      });

      const data = await response.json();
      
      if (data.success) {
        // Sucesso no backend
        const msg = getMensagemSucesso(tipo, funcionarioAtual.nome);
        setMensagem(msg);
        setUltimoRegistro({
          nome: funcionarioAtual.nome,
          tipo: tipo,
          horario: new Date().toLocaleTimeString('pt-BR')
        });
        falarTexto(tipo);
        playConfirmationSound();
        resetarInterface();
      } else {
        // Erro do backend
        setMensagem(`❌ ${data.message}`);
        setTimeout(() => {
          setBloqueado(false);
          setMostrarTipo(true);
        }, 2000);
      }
    } catch (error) {
      // Erro de conexão - usar localStorage
      registrarPontoLocal(tipo);
    }
  };

  // Registrar localmente (offline)
  const registrarPontoLocal = (tipo) => {
    const agora = new Date();
    const registro = {
      id: Date.now(),
      pin: pin,
      nome: funcionarioAtual.nome,
      data: agora.toLocaleDateString('pt-BR'),
      horario: agora.toLocaleTimeString('pt-BR'),
      tipo: tipo,
      timestamp: agora.toISOString(),
      sincronizado: false
    };

    // Salvar no localStorage
    const pendentes = JSON.parse(localStorage.getItem('registrosPendentes') || '[]');
    pendentes.push(registro);
    localStorage.setItem('registrosPendentes', JSON.stringify(pendentes));

    const msg = getMensagemSucesso(tipo, funcionarioAtual.nome) + ' (offline)';
    setMensagem(msg);
    setUltimoRegistro({
      nome: funcionarioAtual.nome,
      tipo: tipo,
      horario: agora.toLocaleTimeString('pt-BR')
    });
    
    falarTexto(tipo);
    playConfirmationSound();
    resetarInterface();
  };

  // Sincronizar registros pendentes
  const sincronizarPendentes = async () => {
    const pendentes = JSON.parse(localStorage.getItem('registrosPendentes') || '[]');
    if (pendentes.length === 0) return;

    setMensagem('Sincronizando...');
    
    try {
      const registrosParaEnviar = pendentes.map(p => ({
        pin: p.pin,
        tipo: p.tipo,
        horario: p.timestamp
      }));

      const response = await fetch(`${API_BASE_URL}/api/registros/sincronizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registros: registrosParaEnviar })
      });

      const data = await response.json();
      
      if (data.success) {
        // Limpar pendentes sincronizados
        localStorage.removeItem('registrosPendentes');
        setMensagem(`✅ ${data.sucessos} registros sincronizados`);
        setTimeout(() => setMensagem(''), 3000);
      }
    } catch (error) {
      console.log('Falha na sincronização');
    }
  };

  // Helper functions
  const getMensagemSucesso = (tipo, nome) => {
    const mensagens = {
      entrada: `✅ Entrada registrada, ${nome}!`,
      saida: `✅ Saída registrada, ${nome}!`,
      entrada_intervalo: `✅ Intervalo iniciado, ${nome}!`,
      saida_intervalo: `✅ Retorno do intervalo, ${nome}!`
    };
    return mensagens[tipo] || `✅ Registro realizado, ${nome}!`;
  };

  const falarTexto = (tipo) => {
    if (!('speechSynthesis' in window)) return;
    
    const textos = {
      entrada: 'Entrada registrada',
      saida: 'Saída registrada',
      entrada_intervalo: 'Intervalo iniciado',
      saida_intervalo: 'Retorno do intervalo'
    };
    
    const texto = textos[tipo] || 'Registro realizado';
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    
    speechSynthesis.speak(utterance);
  };

  const playConfirmationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const resetarInterface = () => {
    setTimeout(() => {
      setPin('');
      setFuncionarioAtual(null);
      setMostrarTipo(false);
      setBloqueado(false);
    }, 1500);
  };

  const handleTecla = (tecla) => {
    if (bloqueado) return;

    if (tecla === 'C') {
      setPin('');
      setMensagem('');
      setMostrarTipo(false);
      setFuncionarioAtual(null);
    } else if (tecla === 'OK') {
      validarPin();
    } else if (pin.length < 6) {
      setPin(prev => prev + tecla);
    }
  };

  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];

  // Preloader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-blue-900 relative overflow-hidden">
        {/* Efeito de partículas */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20 animate-float"
              style={{
                width: `${Math.random() * 30 + 10}px`,
                height: `${Math.random() * 30 + 10}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            />
          ))}
        </div>

        <div className="flex flex-col items-center z-10">
          <div className="relative">
            <img
              src="/logo.png"
              alt="Logo Cristal Acquacenter"
              className="w-48 h-48 object-contain animate-logo-glow"
            />
            <div className="absolute inset-0 w-48 h-48 bg-blue-400/30 rounded-full animate-ping-slow" />
          </div>

          <div className="mt-8 text-center w-full max-w-md mx-auto">
            <p className="text-white text-xl font-semibold mb-4 animate-typewriter">
              Sistema de ponto carregando...
            </p>
            
            <div className="flex justify-center">
              <div className="w-64 h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white animate-progress-bar" />
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>

        <style>{`
          @keyframes logoGlow {
            0%, 100% { 
              transform: scale(1) rotate(0deg);
              filter: drop-shadow(0 0 10px rgba(255,255,255,0.5));
            }
            50% { 
              transform: scale(1.05) rotate(2deg);
              filter: drop-shadow(0 0 20px rgba(255,255,255,0.8));
            }
          }
          @keyframes typewriter {
            from { width: 0; }
            to { width: 100%; }
          }
          @keyframes progressBar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes pingSlow {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
          .animate-logo-glow {
            animation: logoGlow 2s ease-in-out infinite;
          }
          .animate-typewriter {
            overflow: hidden;
            white-space: nowrap;
            border-right: 2px solid white;
            animation: typewriter 2s steps(40) 0.5s both,
                       blink-caret 0.75s step-end infinite;
          }
          .animate-progress-bar {
            animation: progressBar 6s ease-in-out infinite;
          }
          .animate-float {
            animation: float linear infinite;
          }
          .animate-ping-slow {
            animation: pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          @keyframes blink-caret {
            from, to { border-color: transparent }
            50% { border-color: white }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-500 text-white flex flex-col items-center justify-center px-4 py-6 relative">
      
      {/* Status Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${online ? 'bg-green-500' : 'bg-yellow-500'}`}>
          {statusConexao}
        </div>
        
        <button
          onClick={() => navigate('/login')}
          className="bg-black/70 hover:bg-black text-white px-4 py-2 rounded-lg text-sm shadow-lg flex items-center gap-2"
        >
          ⚙️ Admin
        </button>
      </div>

      {/* Logo e título */}
      <div className="text-center mb-8 mt-16">
        <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
          <img src="/logo.png" alt="Logo Cristal Acquacenter" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
          <h1 className="text-2xl md:text-3xl font-bold">Sistema de Ponto Cristal Acquacenter</h1>
        </div>

        <div className="flex items-center justify-center gap-6 text-lg">
          <span className="flex items-center gap-2">
            🕒 {horaAtual}
          </span>
          {temperatura !== null && (
            <span className="flex items-center gap-2">
              {iconeClima} {Math.round(temperatura)}°C
            </span>
          )}
        </div>
      </div>

      {/* Display do PIN */}
      <div className="text-4xl md:text-5xl tracking-widest bg-white/10 py-4 px-10 rounded-2xl mb-8 font-mono border border-white/20">
        {pin ? pin.replace(/./g, '●') : 'Digite seu PIN'}
      </div>

      {/* Teclado */}
      <div className="grid grid-cols-3 gap-4 max-w-[400px] mb-8">
        {teclas.map(tecla => (
          <button
            key={tecla}
            onClick={() => handleTecla(tecla)}
            disabled={bloqueado}
            className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl font-bold text-2xl shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95
              ${tecla === 'OK' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : tecla === 'C' 
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-white text-blue-900 hover:bg-blue-50'
              } ${bloqueado ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {tecla}
          </button>
        ))}
      </div>

      {/* Mensagens */}
      {mensagem && (
        <div className={`w-full max-w-md px-6 py-4 rounded-xl text-center text-lg font-bold mb-6 animate-pulse
          ${mensagem.includes('✅') ? 'bg-green-500/20 border border-green-500 text-green-100' : 
            mensagem.includes('❌') ? 'bg-red-500/20 border border-red-500 text-red-100' : 
            'bg-yellow-500/20 border border-yellow-500 text-yellow-100'}`}
        >
          {mensagem}
        </div>
      )}

      {/* Seleção de tipo */}
      {mostrarTipo && funcionarioAtual && (
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 mb-8 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-center">
            👋 Olá, <span className="text-yellow-300">{funcionarioAtual.nome}</span>!
          </h2>
          <p className="text-center mb-6">Selecione o tipo de registro:</p>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { tipo: 'entrada', label: 'ENTRADA', cor: 'bg-green-600 hover:bg-green-700', emoji: '👋' },
              { tipo: 'entrada_intervalo', label: 'INÍCIO INTERVALO', cor: 'bg-yellow-600 hover:bg-yellow-700', emoji: '☕' },
              { tipo: 'saida_intervalo', label: 'RETORNO INTERVALO', cor: 'bg-orange-600 hover:bg-orange-700', emoji: '↩️' },
              { tipo: 'saida', label: 'SAÍDA', cor: 'bg-red-600 hover:bg-red-700', emoji: '👋' }
            ].map(item => (
              <button
                key={item.tipo}
                onClick={() => registrarPonto(item.tipo)}
                disabled={bloqueado}
                className={`${item.cor} text-white font-bold p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50`}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Último registro */}
      {ultimoRegistro && (
        <div className="bg-blue-800/50 p-4 rounded-xl mb-6 border border-blue-600/50 w-full max-w-md">
          <div className="text-center">
            <div className="text-sm text-blue-200 mb-1">Último registro:</div>
            <div className="font-semibold">{ultimoRegistro.nome}</div>
            <div className="text-sm">
              {ultimoRegistro.tipo.toUpperCase()} • {ultimoRegistro.horario}
            </div>
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <button
          onClick={testarConexaoBackend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg shadow-lg flex items-center gap-2"
        >
          🔄 Testar Conexão
        </button>
        
        <button
          onClick={sincronizarPendentes}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl text-lg shadow-lg flex items-center gap-2"
        >
          📡 Sincronizar
        </button>
      </div>

      {/* Informações de teste */}
      <div className="text-center text-sm text-white/70 max-w-md">
        <p className="mb-2">Para teste rápido, use PIN: <span className="font-mono bg-white/20 px-2 py-1 rounded">1234</span></p>
        <p>Status: {online ? 'Conectado ao servidor' : 'Modo offline - dados locais'}</p>
      </div>

      {/* Footer */}
      <footer className="text-white/60 text-center py-4 text-sm mt-8">
        Desenvolvido por <span className="font-semibold text-white">Isac Miranda</span> © 2025
      </footer>
    </div>
  );
}