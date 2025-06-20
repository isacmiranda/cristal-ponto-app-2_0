import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminPage = () => {
  const [registros, setRegistros] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', pin: '' });
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    buscarRegistros();
    buscarFuncionarios();
  }, []);

  const buscarRegistros = async () => {
    try {
      const response = await axios.get('https://backend-ponto-digital-1.onrender.com/api/registros');
      setRegistros(response.data);
    } catch (error) {
      alert('Erro ao buscar registros');
      console.error(error);
    }
  };

  const buscarFuncionarios = async () => {
    try {
      const response = await axios.get('https://backend-ponto-digital-1.onrender.com/api/funcionarios');
      setFuncionarios(response.data);
    } catch (error) {
      alert('Erro ao buscar funcionários');
      console.error(error);
    }
  };

  const adicionarFuncionario = async () => {
    if (!novoFuncionario.nome || !novoFuncionario.pin) {
      alert('Preencha todos os campos.');
      return;
    }
    if (funcionarios.some(f => f.pin === novoFuncionario.pin)) {
      alert('Já existe um funcionário com esse PIN.');
      return;
    }
    try {
      setCarregando(true);
      await axios.post('https://backend-ponto-digital-1.onrender.com/api/funcionarios', novoFuncionario);
      setNovoFuncionario({ nome: '', pin: '' });
      buscarFuncionarios();
      alert('Funcionário adicionado com sucesso!');
    } catch (error) {
      alert('Erro ao adicionar funcionário');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const editarRegistro = async (id, campo, valor) => {
    try {
      setCarregando(true);
      if (campo === 'hora') {
        const registro = registros.find(r => r._id === id);
        if (!registro) return;
        const timestampOriginal = new Date(registro.timestamp);
        const [hora, minuto] = valor.split(':');
        timestampOriginal.setHours(parseInt(hora), parseInt(minuto), 0, 0);
        await axios.put(`https://backend-ponto-digital-1.onrender.com/api/registros/${id}`, {
          timestamp: timestampOriginal.toISOString()
        });
      } else {
        await axios.put(`https://backend-ponto-digital-1.onrender.com/api/registros/${id}`, {
          [campo]: valor
        });
      }
      buscarRegistros();
    } catch (error) {
      alert('Erro ao editar registro');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const excluirRegistro = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
      setCarregando(true);
      await axios.delete(`https://backend-ponto-digital-1.onrender.com/api/registros/${id}`);
      buscarRegistros();
    } catch (error) {
      alert('Erro ao excluir registro');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const excluirFuncionario = async (id) => {
    if (!window.confirm('Excluir funcionário também excluirá seus registros. Continuar?')) return;
    try {
      setCarregando(true);
      await axios.delete(`https://backend-ponto-digital-1.onrender.com/api/funcionarios/${id}`);
      buscarFuncionarios();
      buscarRegistros();
    } catch (error) {
      alert('Erro ao excluir funcionário');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const registrosFiltrados = useMemo(() => {
    return registros
      .filter((registro) => {
        const funcionario = funcionarios.find(f => f.pin === registro.pin);
        const nome = funcionario ? funcionario.nome.toLowerCase() : '';
        const pin = funcionario ? funcionario.pin : '';
        const termo = filtroNome.toLowerCase();
        return nome.includes(termo) || pin.includes(termo);
      })
      .filter((registro) => {
        const dataRegistro = new Date(registro.timestamp);
        const inicio = dataInicio ? new Date(dataInicio) : null;
        const fim = dataFim ? new Date(dataFim) : null;
        return (!inicio || dataRegistro >= inicio) && (!fim || dataRegistro <= fim);
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [registros, funcionarios, filtroNome, dataInicio, dataFim]);

  const formatarHoraParaInput = (timestamp) => {
    const date = new Date(timestamp);
    const hora = String(date.getHours()).padStart(2, '0');
    const minuto = String(date.getMinutes()).padStart(2, '0');
    return `${hora}:${minuto}`;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-center mb-4">Área Administrativa</h2>

      <div className="mb-6 border rounded p-4">
        <h3 className="text-lg font-semibold mb-2">Adicionar Funcionário</h3>
        <div className="flex flex-col md:flex-row gap-2">
          <input type="text" placeholder="Nome" value={novoFuncionario.nome} onChange={(e) => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })} className="border p-2 rounded w-full md:w-1/3" />
          <input type="text" placeholder="PIN" value={novoFuncionario.pin} onChange={(e) => setNovoFuncionario({ ...novoFuncionario, pin: e.target.value })} className="border p-2 rounded w-full md:w-1/3" />
          <button onClick={adicionarFuncionario} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={carregando}>Adicionar</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input type="text" placeholder="Filtrar por nome ou PIN" value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} className="border p-2 rounded w-full md:w-1/3" />
        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="border p-2 rounded" />
        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="border p-2 rounded" />
        <button onClick={() => { setFiltroNome(''); setDataInicio(''); setDataFim(''); }} className="bg-gray-400 text-white px-4 py-2 rounded">Limpar</button>
        <button onClick={() => window.print()} className="bg-green-600 text-white px-4 py-2 rounded">Imprimir</button>
      </div>

      <div className="overflow-auto max-h-[500px]">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Nome</th>
              <th className="border p-2">PIN</th>
              <th className="border p-2">Data</th>
              <th className="border p-2">Hora</th>
              <th className="border p-2">Tipo</th>
              <th className="border p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.map((registro) => {
              const funcionario = funcionarios.find(f => f.pin === registro.pin);
              const nome = funcionario ? funcionario.nome : 'Desconhecido';
              const dataHora = new Date(registro.timestamp);
              const data = dataHora.toLocaleDateString();
              const horaInput = formatarHoraParaInput(registro.timestamp);
              return (
                <tr key={registro._id}>
                  <td className="border p-2">{nome}</td>
                  <td className="border p-2">{registro.pin}</td>
                  <td className="border p-2">{data}</td>
                  <td className="border p-2">
                    <input type="time" value={horaInput} onChange={(e) => editarRegistro(registro._id, 'hora', e.target.value)} className="border rounded p-1 w-24" />
                  </td>
                  <td className="border p-2">
                    <select value={registro.tipo} onChange={(e) => editarRegistro(registro._id, 'tipo', e.target.value)} className="border rounded p-1">
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </select>
                  </td>
                  <td className="border p-2">
                    <button onClick={() => excluirRegistro(registro._id)} className="bg-red-600 text-white px-2 py-1 rounded">Excluir</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Funcionários</h3>
        <ul className="space-y-2">
          {funcionarios.map((f) => (
            <li key={f._id} className="flex justify-between items-center border p-2 rounded">
              <span>{f.nome} (PIN: {f.pin})</span>
              <button onClick={() => excluirFuncionario(f._id)} className="bg-red-500 text-white px-2 py-1 rounded">Remover</button>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={() => navigate('/')} className="fixed bottom-4 right-4 bg-gray-700 text-white px-4 py-2 rounded shadow-lg">Voltar</button>
    </div>
  );
};

export default AdminPage;
