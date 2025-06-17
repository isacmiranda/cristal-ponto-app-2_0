import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminPage() {
  const API_BASE = 'https://backend-ponto-digital-1.onrender.com/api';
  const navigate = useNavigate();

  const [registros, setRegistros] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', pin: '' });
  const [fotoFile, setFotoFile] = useState(null);
  const [filtroNome, setFiltroNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    buscarFuncionarios();
    buscarRegistros();
  }, []);

  const buscarFuncionarios = async () => {
    try {
      const res = await axios.get(`${API_BASE}/funcionarios`);
      setFuncionarios(res.data);
    } catch (err) {
      console.error('Erro ao buscar funcionários:', err);
    }
  };

  const buscarRegistros = async () => {
    try {
      const res = await axios.get(`${API_BASE}/registros`);
      setRegistros(res.data);
    } catch (err) {
      console.error('Erro ao buscar registros:', err);
    }
  };

  const adicionarFuncionario = async () => {
    if (!novoFuncionario.nome || !novoFuncionario.pin || !fotoFile) {
      return alert("Preencha nome, PIN e selecione uma foto.");
    }

    try {
      const formData = new FormData();
      formData.append('nome', novoFuncionario.nome);
      formData.append('pin', novoFuncionario.pin);
      formData.append('foto', fotoFile);

      await axios.post(`${API_BASE}/funcionarios`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setNovoFuncionario({ nome: '', pin: '' });
      setFotoFile(null);
      buscarFuncionarios();
    } catch (err) {
      console.error('Erro ao adicionar funcionário:', err);
    }
  };

  const editarFuncionario = async (func) => {
    const nome = prompt('Novo nome:', func.nome);
    const pin = prompt('Novo PIN:', func.pin);
    if (!nome || !pin) return;

    try {
      await axios.put(`${API_BASE}/funcionarios/${func._id}`, { nome, pin });
      buscarFuncionarios();
    } catch (err) {
      console.error('Erro ao editar funcionário:', err);
    }
  };

  const excluirFuncionario = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este funcionário?")) return;
    try {
      await axios.delete(`${API_BASE}/funcionarios/${id}`);
      buscarFuncionarios();
    } catch (err) {
      console.error('Erro ao excluir funcionário:', err);
    }
  };

  const excluirRegistro = async (id) => {
    if (!window.confirm("Deseja excluir este registro?")) return;
    try {
      await axios.delete(`${API_BASE}/registros/${id}`);
      buscarRegistros();
    } catch (err) {
      console.error('Erro ao excluir registro:', err);
    }
  };

  const editarRegistro = async (reg) => {
    const novoHorario = prompt('Novo horário (YYYY-MM-DD HH:mm):', reg.horario);
    const novoTipo = prompt('Novo tipo (entrada/saida):', reg.tipo);
    if (!novoHorario || !novoTipo) return;

    try {
      await axios.put(`${API_BASE}/registros/${reg._id}`, {
        ...reg,
        horario: novoHorario,
        tipo: novoTipo.toLowerCase(),
      });
      buscarRegistros();
    } catch (err) {
      console.error('Erro ao editar registro:', err);
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
                </tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const filtrarRegistros = () => {
    return registros.filter(reg => {
      const nome = reg.nome?.toLowerCase() || '';
      const horario = new Date(reg.horario);
      const inicio = dataInicio ? new Date(dataInicio) : null;
      const fim = dataFim ? new Date(dataFim + 'T23:59:59') : null;

      return (
        (!filtroNome || nome.includes(filtroNome.toLowerCase())) &&
        (!inicio || horario >= inicio) &&
        (!fim || horario <= fim)
      );
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-6">
      {/* Topo */}
      <div className="flex justify-between w-full p-4 bg-blue-800">
        <h1 className="text-xl font-semibold">Admin - Sistema de Ponto Cristal Acquacenter</h1>
        <button onClick={() => navigate('/')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded">🔙</button>
      </div>

      {/* Formulário de Funcionário */}
      <div className="bg-white text-black rounded-lg shadow p-4 w-full max-w-3xl mt-6">
        <h2 className="text-xl font-bold mb-2">Novo Funcionário</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input className="border p-2 rounded" placeholder="Nome" value={novoFuncionario.nome} onChange={e => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })} />
          <input className="border p-2 rounded" placeholder="PIN" value={novoFuncionario.pin} onChange={e => setNovoFuncionario({ ...novoFuncionario, pin: e.target.value })} />
          <input type="file" accept="image/*" onChange={e => setFotoFile(e.target.files[0])} className="border p-2 rounded" />
        </div>
        {fotoFile && <p className="mb-2 text-sm text-gray-600">Foto selecionada: {fotoFile.name}</p>}
        <button onClick={adicionarFuncionario} className="bg-blue-600 text-white px-4 py-2 rounded">Adicionar</button>
      </div>

      {/* Filtros e Registros */}
      <div className="bg-white text-black rounded-lg shadow p-4 w-full max-w-4xl mt-6">
        <h2 className="text-xl font-bold mb-2">Registros</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          <input className="border p-2 rounded" placeholder="Filtrar por nome" value={filtroNome} onChange={e => setFiltroNome(e.target.value)} />
          <input type="date" className="border p-2 rounded" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <input type="date" className="border p-2 rounded" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          <button onClick={buscarRegistros} className="bg-green-600 text-white px-4 py-2 rounded">Buscar</button>
          <button onClick={() => { setFiltroNome(''); setDataInicio(''); setDataFim(''); }} className="bg-gray-600 text-white px-4 py-2 rounded">Limpar</button>
        </div>
        <table className="w-full table-auto border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2">Data</th>
              <th className="border px-2">Horário</th>
              <th className="border px-2">Nome</th>
              <th className="border px-2">Tipo</th>
              <th className="border px-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrarRegistros().map((r) => (
              <tr key={r._id}>
                <td className="border px-2">{r.data}</td>
                <td className="border px-2">{r.horario}</td>
                <td className="border px-2">{r.nome}</td>
                <td className="border px-2">{r.tipo}</td>
                <td className="border px-2">
                  <button onClick={() => editarRegistro(r)} className="bg-yellow-400 px-2 py-1 rounded mr-1">Editar</button>
                  <button onClick={() => excluirRegistro(r._id)} className="bg-red-500 px-2 py-1 rounded">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={imprimir} className="mt-4 bg-blue-700 text-white px-4 py-2 rounded">Imprimir</button>
      </div>

      {/* Lista de Funcionários */}
      <div className="bg-white text-black rounded-lg shadow p-4 w-full max-w-3xl mt-6">
        <h2 className="text-xl font-bold mb-2">Funcionários</h2>
        <table className="w-full table-auto border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2">Nome</th>
              <th className="border px-2">PIN</th>
              <th className="border px-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map(f => (
              <tr key={f._id}>
                <td className="border px-2">{f.nome}</td>
                <td className="border px-2">{f.pin}</td>
                <td className="border px-2">
                  <button onClick={() => editarFuncionario(f)} className="bg-yellow-400 px-2 py-1 rounded mr-1">Editar</button>
                  <button onClick={() => excluirFuncionario(f._id)} className="bg-red-500 px-2 py-1 rounded">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
