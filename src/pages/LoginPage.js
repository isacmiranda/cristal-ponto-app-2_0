import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaArrowLeft } from 'react-icons/fa';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

 
  const usuarioValido = 'admin';
  const senhaValida = 'admin123';

  const handleLogin = () => {
    if (usuario === usuarioValido && senha === senhaValida) {
      localStorage.setItem('usuarioAutenticado', 'true'); 
      navigate('/admin'); 
    } else {
      setErro('Usuário ou senha inválidos');
    }
  };

  const handleVoltar = () => {
    navigate('/'); 
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 px-4 relative">
      <button
        onClick={handleVoltar}
        className="absolute top-4 left-4 flex items-center text-blue-600 hover:text-blue-800 transition"
        title="Voltar para o registro de ponto"
      >
        <FaArrowLeft className="mr-1" />
        <span className="text-sm font-semibold">Voltar</span>
      </button>

      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg w-full max-w-md border border-blue-100">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-blue-700">Login Administrativo</h2>

        <div className="flex justify-center mb-4 text-blue-500">
          <FaUserCircle size={60} className="sm:size-[70px]" />
        </div>

        {erro && <p className="text-red-600 text-sm mb-3 text-center">{erro}</p>}

        <input
          type="text"
          placeholder="Usuário"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
