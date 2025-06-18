import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://backend-ponto-digital-1.onrender.com';

function AdminPage() {
  const [registros, setRegistros] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroPin, setFiltroPin] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [novoRegistro, setNovoRegistro] = useState({
    nome: '',
    pin: '',
    data: '',
    horario: '',
    tipo: 'Entrada',
  });

  const navigate = useNavigate();

  const buscarRegistros = async () => {
    try {
      const response = await axios.get(`${API_BASE}/registros`);
      setRegistros(response.data);
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
    }
  };

  const buscarFuncionarios = async () => {
    try {
      const response = await axios.get(`${API_BASE}/funcionarios`);
      setFuncionarios(response.data);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
    }
  };

  useEffect(() => {
    buscarRegistros();
    buscarFuncionarios();
  }, []);

  const logout = () => {
    navigate('/');
  };

  const adicionarFuncionario = async () => {
    const nome = prompt('Nome do funcionário:');
    const pin = prompt('PIN do funcionário:');
    if (nome && pin) {
      try {
        const response = await axios.post(`${API_BASE}/funcionarios`, {
          nome,
          pin
        });
        console.log('Funcionário adicionado:', response.data);
        buscarFuncionarios();
      } catch (error) {
        console.error('Erro ao adicionar funcionário:', error.response ? error.response.data : error);
      }
    }
  };

  const editarFuncionario = async (funcionario) => {
    const novoNome = prompt('Novo nome:', funcionario.nome);
    const novoPin = prompt('Novo PIN:', funcionario.pin);
    if (novoNome && novoPin) {
      try {
        const response = await axios.put(`${API_BASE}/funcionarios/${funcionario._id}`, {
          nome: novoNome,
          pin: novoPin
        });
        console.log('Funcionário editado:', response.data);
        buscarFuncionarios();
      } catch (error) {
        console.error('Erro ao editar funcionário:', error.response ? error.response.data : error);
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

  const editarRegistro = (registro) => {
    const novaData = prompt('Nova data (YYYY-MM-DD):', registro.data);
    const novoHorario = prompt('Novo horário (HH:MM):', registro.horario);
    const novoTipo = prompt('Novo tipo (Entrada/Saída):', registro.tipo);
    if (novaData && novoHorario && novoTipo) {
      axios
        .put(`${API_BASE}/registros/${registro._id}`, {
          data: novaData,
          horario: novoHorario,
          tipo: novoTipo,
        })
        .then(() => buscarRegistros())
        .catch((err) => console.error('Erro ao editar registro:', err));
    }
  };

  const excluirRegistro = (id) => {
    axios.delete(`${API_BASE}/registros/${id}`).then(() => buscarRegistros());
  };

  const adicionarRegistroManual = async () => {
    if (!novoRegistro.nome || !novoRegistro.pin || !novoRegistro.data || !novoRegistro.horario || !novoRegistro.tipo) {
      alert('Preencha todos os campos do registro.');
      return;
    }

    try {
      await axios.post(`${API_BASE}/registros`, novoRegistro);
      setNovoRegistro({ nome: '', pin: '', data: '', horario: '', tipo: 'Entrada' });
      buscarRegistros();
    } catch (error) {
      console.error('Erro ao adicionar registro manual:', error);
    }
  };

  const filtrarRegistros = () => {
    return registros.filter((registro) => {
      const nomeOk = registro.nome.toLowerCase().includes(filtroNome.toLowerCase());
      const pinOk = filtroPin ? registro.pin === filtroPin : true;
      const data = new Date(registro.data);
      const inicioOk = dataInicio ? data >= new Date(dataInicio) : true;
      const fimOk = dataFim ? data <= new Date(dataFim) : true;
      return nomeOk && pinOk && inicioOk && fimOk;
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Administração de Registros</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <input className="border p-2 rounded" placeholder="Filtrar por nome" value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} />
        <input className="border p-2 rounded" placeholder="Filtrar por PIN" value={filtroPin} onChange={(e) => setFiltroPin(e.target.value)} />
        <input className="border p-2 rounded" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        <input className="border p-2 rounded" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        <button onClick={buscarRegistros} className="bg-blue-600 text-white px-4 py-2 rounded">Buscar</button>
        <button onClick={() => { setFiltroNome(''); setFiltroPin(''); setDataInicio(''); setDataFim(''); }} className="bg-gray-500 text-white px-4 py-2 rounded">Limpar</button>
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded ml-auto">Sair</button>
      </div>

      <div className="mb-6 bg-gray-100 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Adicionar Registro Manual</h3>
        <div className="grid grid-cols-5 gap-2">
          <input className="border p-2 rounded" placeholder="Nome" value={novoRegistro.nome} onChange={(e) => setNovoRegistro({ ...novoRegistro, nome: e.target.value })} />
          <input className="border p-2 rounded" placeholder="PIN" value={novoRegistro.pin} onChange={(e) => setNovoRegistro({ ...novoRegistro, pin: e.target.value })} />
          <input type="date" className="border p-2 rounded" value={novoRegistro.data} onChange={(e) => setNovoRegistro({ ...novoRegistro, data: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Horário" value={novoRegistro.horario} onChange={(e) => setNovoRegistro({ ...novoRegistro, horario: e.target.value })} />
          <select className="border p-2 rounded" value={novoRegistro.tipo} onChange={(e) => setNovoRegistro({ ...novoRegistro, tipo: e.target.value })}>
            <option>Entrada</option>
            <option>Saída</option>
          </select>
        </div>
        <button onClick={adicionarRegistroManual} className="mt-2 bg-green-700 text-white px-4 py-2 rounded">Adicionar Registro</button>
      </div>

      <h2 className="text-xl font-bold mb-2">Funcionários</h2>
      <button onClick={adicionarFuncionario} className="bg-green-700 text-white px-4 py-2 mb-2 rounded">Adicionar Funcionário</button>
      <ul className="mb-6">
        {funcionarios.map((f) => (
          <li key={f._id} className="flex justify-between items-center border-b py-1">
            <span>{f.nome} ({f.pin})</span>
            <div>
              <button onClick={() => editarFuncionario(f)} className="text-blue-600 mr-2">Editar</button>
              <button onClick={() => excluirFuncionario(f._id)} className="text-red-600">Excluir</button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-bold mb-2">Registros</h2>
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Nome</th>
            <th className="border p-2">PIN</th>
            <th className="border p-2">Data</th>
            <th className="border p-2">Horário</th>
            <th className="border p-2">Tipo</th>
            <th className="border p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtrarRegistros().map((r) => (
            <tr key={r._id}>
              <td className="border p-2">{r.nome}</td>
              <td className="border p-2">{r.pin}</td>
              <td className="border p-2">{r.data}</td>
              <td className="border p-2">{r.horario}</td>
              <td className="border p-2">{r.tipo}</td>
              <td className="border p-2">
                <button onClick={() => editarRegistro(r)} className="text-blue-600 mr-2">Editar</button>
                <button onClick={() => excluirRegistro(r._id)} className="text-red-600">Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPage;