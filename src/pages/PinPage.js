import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PinPage() {
  const [pin, setPin] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [horaAtual, setHoraAtual] = useState('');
  const navigate = useNavigate();

  // Carregar os funcionários do localStorage
  const funcionarios = JSON.parse(localStorage.getItem('funcionarios')) || [];

  useEffect(() => {
    atualizarHora();
    const intervalo = setInterval(atualizarHora, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const atualizarHora = () => {
    const agora = new Date();
    setHoraAtual(agora.toLocaleTimeString('pt-BR'));
  };

  const registrarPonto = () => {
    if (!pin) return;

    const funcionario = funcionarios.find((f) => f.pin === pin);

    if (!funcionario) {
      setMensagem('PIN inválido!');
      setPin('');
      return;
    }

    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const horario = agora.toLocaleTimeString('pt-BR');

    const registros = JSON.parse(localStorage.getItem('registros')) || [];

    // Verifica o último registro do dia
    const registrosDoDia = registros.filter(
      (r) => r.pin === pin && r.data === data
    );
    const ultimoRegistro = registrosDoDia[registrosDoDia.length - 1];

    const tipoRegistro =
      !ultimoRegistro || ultimoRegistro.tipo === 'saida' ? 'entrada' : 'saida';

    registros.push({
      pin,
      nome: funcionario.nome, // <-- Correção aqui
      data,
      tipo: tipoRegistro,
      horario
    });

    localStorage.setItem('registros', JSON.stringify(registros));

    const nomeFuncionario = funcionario?.nome || 'Funcionário';

    const mensagemFinal =
      tipoRegistro === 'entrada'
        ? `Bom trabalho, ${nomeFuncionario}!`
        : `Até logo, ${nomeFuncionario}!`;

    setMensagem(mensagemFinal);
    setPin('');
  };

  const handleTecla = (valor) => {
    if (valor === 'C') {
      setPin('');
    } else if (valor === 'OK') {
      registrarPonto();
    } else {
      if (pin.length < 6) setPin(pin + valor);
    }
  };

  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-500 text-white flex flex-col items-center justify-center px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Sistema de Ponto Cristal Acquacenter</h1>
        <p className="text-lg md:text-xl">{horaAtual}</p>
      </div>

      <div className="text-3xl md:text-4xl tracking-widest bg-white/20 py-3 px-8 rounded-xl mb-6">
        {pin.replace(/./g, '●')}
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-[300px] sm:max-w-[360px] md:max-w-[400px]">
        {teclas.map((tecla, i) => (
          <button
            key={i}
            onClick={() => handleTecla(tecla)}
            className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 
              rounded-full font-bold text-xl sm:text-2xl shadow flex items-center justify-center
              ${tecla === 'OK' ? 'bg-green-600 text-white hover:bg-green-500' :
                tecla === 'C' ? 'bg-red-600 text-white hover:bg-red-500' :
                'bg-white text-blue-900 hover:bg-blue-100'}`}
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

