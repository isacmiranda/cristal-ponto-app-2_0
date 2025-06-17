import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminPage() {
  const API_BASE = 'https://backend-ponto-digital-1.onrender.com/api';
  const navigate = useNavigate();

  const [registros, setRegistros] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', pin: '', foto: '' });
  const [filtroNome, setFiltroNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

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

  const adicionarFuncionario = async () => {
    if (!novoFuncionario.nome || !novoFuncionario.pin) return;
    try {
      await axios.post(`${API_BASE}/funcionarios`, novoFuncionario);
      setNovoFuncionario({ nome: '', pin: '', foto: '' });
      buscarFuncionarios();
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
    }
  };

  const editarFuncionario = async (funcionario) => {
    const nome = prompt('Novo nome:', funcionario.nome);
    const pin = prompt('Novo PIN:', funcionario.pin);
    const foto = prompt('Nova URL da Foto:', funcionario.foto);
    if (nome && pin) {
      try {
        await axios.put(`${API_BASE}/funcionarios/${funcionario._id}`, { nome, pin, foto });
        buscarFuncionarios();
      } catch (error) {
        console.error('Erro ao editar funcionário:', error);
      }
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

  const excluirRegistro = async (id) => {
    try {
      await axios.delete(`${API_BASE}/registros/${id}`);
      buscarRegistros();
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
    }
  };

  const editarRegistro = async (registro) => {
    const novoHorario = prompt('Novo horário:', registro.horario);
    const novoTipo = prompt('Novo tipo (entrada/saida):', registro.tipo);
    if (novoHorario && novoTipo) {
      try {
        await axios.put(`${API_BASE}/registros/${registro._id}`, {
          ...registro,
          horario: novoHorario,
          tipo: novoTipo,
        });
        buscarRegistros();
      } catch (error) {
        console.error('Erro ao editar registro:', error);
      }
    }
  };

  const imprimir = () => {
    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head><title>Impressão</title></head>
        <body>
          <h1 style="text-align:center">Registro de Ponto Cristal Acquacenter</h1>
          <table border="1" style="width:100%; border-collapse: collapse">
            <thead><tr><th>Data</th><th>Horário</th><th>Nome</th><th>Tipo</th></tr></thead>
            <tbody>
              ${filtrarRegistros().map(r => `
                <tr>
                  <td>${r.data}</td>
                  <td>${r.horario}</td>
                  <td>${r.nome}</td>
                  <td>${r.tipo}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const filtrarRegistros = () => {
    return registros.filter(registro => {
      const nomeFunc = registro.nome?.toLowerCase() || '';
      const dataRegistro = new Date(registro.horario);
      const inicio = dataInicio ? new Date(dataInicio) : null;
      const fim = dataFim ? new Date(dataFim) : null;

      return (
        (!filtroNome || nomeFunc.includes(filtroNome.toLowerCase())) &&
        (!inicio || dataRegistro >= inicio) &&
        (!fim || dataRegistro <= fim)
      );
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-6">
      <div className="flex justify-between w-full p-4 bg-blue-800">
        <h1 className="text-xl font-semibold">Admin - Sistema de Ponto Cristal Acquacenter</h1>
        <button onClick={() => navigate('/')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded">🔙</button>
      </div>

      <div className="bg-white text-black rounded-lg shadow p-4 w-full max-w-3xl mt-6">
        <h2 className="text-xl font-bold mb-2">Novo Funcionário</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input className="border p-2 rounded" placeholder="Nome" value={novoFuncionario.nome} onChange={e => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })} />
          <input className="border p-2 rounded" placeholder="PIN" value={novoFuncionario.pin} onChange={e => setNovoFuncionario({ ...novoFuncionario, pin: e.target.value })} />
          <input className="border p-2 rounded" placeholder="URL da Foto" value={novoFuncionario.foto} onChange={e => setNovoFuncionario({ ...novoFuncionario, foto: e.target.value })} />
        </div>
        <button onClick={adicionarFuncionario} className="bg-blue-600 text-white px-4 py-2 rounded">Adicionar</button>

        <ul className="mt-4 space-y-2">
          {funcionarios.map((f) => (
            <li key={f._id} className="flex justify-between items-center border p-2 rounded">
              <span>{f.nome} (PIN: {f.pin})</span>
              <div className="space-x-2">
                <button onClick={() => editarFuncionario(f)} className="bg-yellow-500 px-2 py-1 rounded">✏️</button>
                <button onClick={() => excluirFuncionario(f._id)} className="bg-red-500 px-2 py-1 rounded">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white text-black rounded-lg shadow p-4 w-full max-w-3xl mt-6">
        <h2 className="text-xl font-bold mb-2">Filtros</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input className="border p-2 rounded" type="text" placeholder="Nome" value={filtroNome} onChange={e => setFiltroNome(e.target.value)} />
          <input className="border p-2 rounded" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <input className="border p-2 rounded" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={buscarRegistros}>Buscar</button>
        <button className="ml-2 bg-gray-600 text-white px-4 py-2 rounded" onClick={() => { setFiltroNome(''); setDataInicio(''); setDataFim(''); }}>Limpar</button>
        <button className="ml-2 bg-purple-600 text-white px-4 py-2 rounded" onClick={imprimir}>🖨️ Imprimir</button>
      </div>

      <div className="bg-white text-black rounded-lg shadow p-4 w-full max-w-3xl mt-6">
        <h2 className="text-xl font-bold mb-2">Registros</h2>
        <table className="w-full border-collapse border">
          <thead>
            <tr>
              <th className="border p-2">Data</th>
              <th className="border p-2">Horário</th>
              <th className="border p-2">Nome</th>
              <th className="border p-2">Tipo</th>
              <th className="border p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrarRegistros().map((r) => (
              <tr key={r._id}>
                <td className="border p-2">{r.data || '-'}</td>
                <td className="border p-2">{r.horario || '-'}</td>
                <td className="border p-2">{r.nome || '-'}</td>
                <td className="border p-2">{r.tipo || '-'}</td>
                <td className="border p-2">
                  <button onClick={() => editarRegistro(r)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">✏️</button>
                  <button onClick={() => excluirRegistro(r._id)} className="bg-red-500 text-white px-2 py-1 rounded">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
