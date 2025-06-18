import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'https://backend-ponto-digital-1.onrender.com';

function AdminPage() {
  const [registros, setRegistros] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', pin: '' });
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    buscarFuncionarios();
    buscarRegistros();
  }, []);

  const buscarFuncionarios = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/funcionarios`);
      setFuncionarios(res.data);
    } catch (err) {
      console.error('Erro ao buscar funcionários:', err);
    }
  };

  const buscarRegistros = async () => {
    setCarregando(true);
    try {
      const res = await axios.get(`${API_BASE}/api/registros`);
      setRegistros(res.data);
    } catch (err) {
      console.error('Erro ao buscar registros:', err);
    }
    setCarregando(false);
  };

  const filtrarRegistros = () => {
    const filtrados = registros.filter(r => {
      const nomeFunc = funcionarios.find(f => f.pin === r.pin)?.nome || '';
      const dt = r.horario ? new Date(r.horario) : null;
      const ini = dataInicio ? new Date(dataInicio) : null;
      const fim = dataFim ? new Date(dataFim) : null;
      const termo = filtroNome.toLowerCase();
      return (
        (!termo || nomeFunc.toLowerCase().includes(termo) || r.pin.includes(termo)) &&
        (!ini || (dt && dt >= ini)) &&
        (!fim || (dt && dt <= fim))
      );
    });
    return filtrados.sort((a, b) => new Date(b.horario) - new Date(a.horario));
  };

  const adicionarFuncionario = async () => {
    if (!novoFuncionario.nome || !novoFuncionario.pin) {
      alert('Preencha todos os campos.');
      return;
    }
    try {
      await axios.post(`${API_BASE}/api/funcionarios`, novoFuncionario);
      setNovoFuncionario({ nome: '', pin: '' });
      buscarFuncionarios();
    } catch (err) {
      console.error('Erro ao adicionar funcionário:', err);
    }
  };

  const editarRegistro = async (id, campo, valor) => {
    try {
      const atual = registros.find(r => r._id === id);
      if (!atual) return;
      const atualizado = { ...atual, [campo]: valor };
      await axios.put(`${API_BASE}/api/registros/${id}`, atualizado);
      buscarRegistros();
    } catch (err) {
      console.error('Erro ao editar registro:', err);
    }
  };

  const excluirRegistro = async id => {
    if (!window.confirm('Deseja realmente excluir este registro?')) return;
    try {
      await axios.delete(`${API_BASE}/api/registros/${id}`);
      buscarRegistros();
    } catch (err) {
      console.error('Erro ao excluir registro:', err);
    }
  };

  const excluirFuncionario = async id => {
    if (!window.confirm('Deseja realmente remover este funcionário?')) return;
    try {
      await axios.delete(`${API_BASE}/api/funcionarios/${id}`);
      buscarFuncionarios();
    } catch (err) {
      console.error('Erro ao excluir funcionário:', err);
    }
  };

  const limparFiltros = () => {
    setFiltroNome('');
    setDataInicio('');
    setDataFim('');
  };

  const imprimir = () => {
    const tabela = document.querySelector('.tabela-registros');
    if (!tabela) return;

    const css = `
      <style>
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #444; padding: 8px; text-align: left; }
      </style>
    `;
    const html = `
      <html>
        <head><title>Folha de ponto - Cristal Acquacenter</title>${css}</head>
        <body>
          <h1>Folha de ponto - Cristal Acquacenter</h1>
          ${tabela.outerHTML}
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Painel Administrativo</h1>

      <div className="mb-4 border p-3 rounded bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Novo Funcionário</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            className="border p-2 rounded"
            placeholder="Nome"
            value={novoFuncionario.nome}
            onChange={e => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })}
          />
          <input
            className="border p-2 rounded"
            placeholder="PIN"
            value={novoFuncionario.pin}
            onChange={e => setNovoFuncionario({ ...novoFuncionario, pin: e.target.value })}
          />
        </div>
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={adicionarFuncionario}
        >
          Adicionar Funcionário
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-2 mb-4">
        <input
          type="text"
          placeholder="Filtrar por nome ou PIN"
          value={filtroNome}
          onChange={e => setFiltroNome(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={dataInicio}
          onChange={e => setDataInicio(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={dataFim}
          onChange={e => setDataFim(e.target.value)}
          className="border p-2 rounded"
        />
        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={buscarRegistros}>
          Buscar
        </button>
        <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={limparFiltros}>
          Limpar
        </button>
        <button className="ml-auto px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" onClick={imprimir}>
          Imprimir
        </button>
      </div>

      {carregando ? (
        <p className="text-center text-gray-600">Carregando registros...</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-gray-600">{filtrarRegistros().length} registro(s) encontrado(s)</p>

          <div className="overflow-x-auto bg-white p-4 rounded shadow tabela-registros">
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
                {filtrarRegistros().map(r => {
                  const nomeFunc = funcionarios.find(f => f.pin === r.pin)?.nome || 'Desconhecido';
                  return (
                    <tr key={r._id} className="border-b">
                      <td className="p-2">{nomeFunc}</td>
                      <td className="p-2">{r.pin}</td>
                      <td className="p-2">
                        <input
                          type="datetime-local"
                          value={
                            r.horario
                              ? format(new Date(r.horario), "yyyy-MM-dd'T'HH:mm")
                              : ''
                          }
                          onChange={e => editarRegistro(r._id, 'horario', e.target.value)}
                          className="border p-1 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={r.tipo}
                          onChange={e => editarRegistro(r._id, 'tipo', e.target.value)}
                          className="border p-1 rounded"
                        >
                          <option value="entrada">Entrada</option>
                          <option value="saida">Saída</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => excluirRegistro(r._id)}
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
        </>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Funcionários</h2>
        <ul className="bg-white p-4 rounded shadow">
          {funcionarios.map(f => (
            <li key={f._id} className="flex items-center justify-between border-b py-2">
              <div>
                <strong>{f.nome}</strong> — PIN: {f.pin}
              </div>
              <button
                onClick={() => excluirFuncionario(f._id)}
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
