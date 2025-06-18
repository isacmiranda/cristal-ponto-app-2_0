import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'https://backend-ponto-digital-1.onrender.com';

function AdminPage() {
  const [registros, setRegistros] = useState([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', pin: '', foto: '' });
  const navigate = useNavigate();

  useEffect(() => {
    buscarFuncionarios();
    buscarRegistros();
  }, []);

  const buscarFuncionarios = async () => {
    try {
      const response = await axios.get(`${API_BASE}/funcionarios`);
      setFuncionarios(response.data);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
    }
  };

  const buscarRegistros = async () => {
    try {
      const response = await axios.get(`${API_BASE}/registros`);
      setRegistros(response.data);
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
    }
  };

  const filtrarRegistros = () => {
    return registros.filter(registro => {
      const nomeFunc = funcionarios.find(f => f.pin === registro.pin)?.nome || '';
      const dataRegistro = new Date(registro.horario);
      const inicio = dataInicio ? new Date(dataInicio) : null;
      const fim = dataFim ? new Date(dataFim) : null;

      return (
        (!filtroNome || nomeFunc.toLowerCase().includes(filtroNome.toLowerCase())) &&
        (!inicio || dataRegistro >= inicio) &&
        (!fim || dataRegistro <= fim)
      );
    });
  };

  const adicionarFuncionario = async () => {
    try {
      await axios.post(`${API_BASE}/funcionarios`, novoFuncionario);
      setNovoFuncionario({ nome: '', pin: '', foto: '' });
      buscarFuncionarios();
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
    }
  };

  const editarRegistro = async (id, campo, valor) => {
    try {
      const registroAtual = registros.find(r => r._id === id);
      if (!registroAtual) return;
      const atualizado = { ...registroAtual, [campo]: valor };
      await axios.put(`${API_BASE}/registros/${id}`, atualizado);
      buscarRegistros();
    } catch (error) {
      console.error('Erro ao editar registro:', error);
    }
  };

  const excluirRegistro = async (id) => {
    try {
      await axios.delete(`${API_BASE}/registros/${id}`);
      buscarRegistros();
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
    }
  };

  const excluirFuncionario = async (id) => {
    try {
      await axios.delete(`${API_BASE}/funcionarios/${id}`);
      buscarFuncionarios();
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
    }
  };

  const limparFiltros = () => {
    setFiltroNome('');
    setDataInicio('');
    setDataFim('');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Painel Administrativo</h1>

      {/* Adição de funcionário */}
      <div className="mb-4 border p-3 rounded bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Novo Funcionário</h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            className="border p-2 rounded"
            placeholder="Nome"
            value={novoFuncionario.nome}
            onChange={(e) => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })}
          />
          <input
            className="border p-2 rounded"
            placeholder="PIN"
            value={novoFuncionario.pin}
            onChange={(e) => setNovoFuncionario({ ...novoFuncionario, pin: e.target.value })}
          />
          <input
            className="border p-2 rounded"
            placeholder="URL da Foto"
            value={novoFuncionario.foto}
            onChange={(e) => setNovoFuncionario({ ...novoFuncionario, foto: e.target.value })}
          />
        </div>
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={adicionarFuncionario}
        >
          Adicionar Funcionário
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-2 mb-4">
        <input
          type="text"
          placeholder="Filtrar por nome"
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="border p-2 rounded"
        />
        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={buscarRegistros}>
          Buscar
        </button>
        <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={limparFiltros}>
          Limpar
        </button>
      </div>

      {/* Lista de registros */}
      <div className="overflow-x-auto bg-white p-4 rounded shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Nome</th>
              <th className="p-2">PIN</th>
              <th className="p-2">Data/Hora</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrarRegistros().map(registro => {
              const nomeFunc = funcionarios.find(f => f.pin === registro.pin)?.nome || 'Desconhecido';

              let horarioFormatado = '';
              try {
                if (registro.horario) {
                  horarioFormatado = format(new Date(registro.horario), "yyyy-MM-dd'T'HH:mm");
                }
              } catch (e) {
                console.error('Erro ao formatar data:', e);
              }

              return (
                <tr key={registro._id} className="border-b">
                  <td className="p-2">{nomeFunc}</td>
                  <td className="p-2">{registro.pin}</td>
                  <td className="p-2">
                    <input
                      type="datetime-local"
                      value={horarioFormatado}
                      onChange={(e) => editarRegistro(registro._id, 'horario', e.target.value)}
                      className="border p-1 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={registro.tipo}
                      onChange={(e) => editarRegistro(registro._id, 'tipo', e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => excluirRegistro(registro._id)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Lista de funcionários */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Funcionários</h2>
        <ul className="bg-white p-4 rounded shadow">
          {funcionarios.map(func => (
            <li key={func._id} className="flex items-center justify-between border-b py-2">
              <div>
                <strong>{func.nome}</strong> — PIN: {func.pin}
              </div>
              <button
                onClick={() => excluirFuncionario(func._id)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => navigate('/')}
        className="mt-6 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Voltar
      </button>
    </div>
  );
}

export default AdminPage;
