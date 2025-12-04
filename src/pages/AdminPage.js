import React, { useEffect, useState } from 'react'; 
import { useNavigate } from 'react-router-dom';

// Configuração da API
const API_BASE_URL = 'https://backend-ponto-digital-2.onrender.com';

export default function AdminPage() {
  const [registros, setRegistros] = useState([]);
  const [todosRegistros, setTodosRegistros] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const registrosPorPagina = 104;

  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFim, setFiltroFim] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroPIN, setFiltroPIN] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', pin: '' });
  const [novoRegistro, setNovoRegistro] = useState({
    funcionarioId: '',
    tipo: '',
    horario: '',
    observacao: ''
  });

  const [ordenacao, setOrdenacao] = useState({ campo: '', direcao: 'asc' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Carregar dados do backend
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar funcionários
      const funcResponse = await fetch(`${API_BASE_URL}/api/funcionarios`);
      const funcData = await funcResponse.json();
      if (funcData.success) {
        setFuncionarios(funcData.data);
      }

      // Carregar registros
      const regResponse = await fetch(`${API_BASE_URL}/api/registros?limit=1000`);
      const regData = await regResponse.json();
      if (regData.success) {
        // Formatar registros para o formato esperado pelo frontend
        const registrosFormatados = regData.data.map(registro => ({
          id: registro._id,
          data: new Date(registro.horario).toLocaleDateString('pt-BR'),
          horario: new Date(registro.horario).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          nome: registro.funcionario?.nome || 'Funcionário não encontrado',
          pin: 'PIN oculto', // PIN não é retornado por segurança
          tipo: registro.tipo,
          funcionarioId: registro.funcionario?._id
        })).sort(multiSort);
        
        setTodosRegistros(registrosFormatados);
        setRegistros(registrosFormatados);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados do servidor');
      // Fallback para localStorage se offline
      const localRegistros = localStorage.getItem('registros');
      const localFuncionarios = localStorage.getItem('funcionarios');
      if (localRegistros) {
        const data = JSON.parse(localRegistros);
        data.sort(multiSort);
        setTodosRegistros(data);
        setRegistros(data);
      }
      if (localFuncionarios) setFuncionarios(JSON.parse(localFuncionarios));
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = () => {
    const inicio = new Date(filtroInicio);
    const fim = new Date(filtroFim);
    const filtrados = todosRegistros
      .filter(r => {
        const dataObj = new Date(r.data.split('/').reverse().join('-'));
        return (
          (!filtroInicio || dataObj >= inicio) &&
          (!filtroFim || dataObj <= fim) &&
          (!filtroNome || r.nome.toLowerCase().includes(filtroNome.toLowerCase())) &&
          (!filtroPIN || r.pin.includes(filtroPIN))
        );
      })
      .sort(multiSort);
    setRegistros(filtrados);
    setPaginaAtual(1);
  };

  const handleLimpar = () => {
    setRegistros(todosRegistros);
    setFiltroInicio('');
    setFiltroFim('');
    setFiltroNome('');
    setFiltroPIN('');
    setPaginaAtual(1);
  };

  const adicionarFuncionario = async () => {
    if (!novoFuncionario.nome || !novoFuncionario.pin) {
      alert('Nome e PIN são obrigatórios');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/funcionarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novoFuncionario)
      });

      const data = await response.json();
      
      if (data.success) {
        setFuncionarios([...funcionarios, data.data]);
        setNovoFuncionario({ nome: '', pin: '' });
        alert('Funcionário adicionado com sucesso!');
        carregarDados(); // Recarregar dados
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
      // Fallback para localStorage
      const atualizados = [...funcionarios, novoFuncionario];
      setFuncionarios(atualizados);
      localStorage.setItem('funcionarios', JSON.stringify(atualizados));
      setNovoFuncionario({ nome: '', pin: '' });
    }
  };

  const adicionarRegistro = async () => {
    if (!novoRegistro.funcionarioId || !novoRegistro.tipo) {
      alert('Funcionário e tipo são obrigatórios');
      return;
    }

    try {
      const horarioCompleto = novoRegistro.horario 
        ? `${new Date().toISOString().split('T')[0]}T${novoRegistro.horario}`
        : new Date().toISOString();

      const response = await fetch(`${API_BASE_URL}/api/registros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          funcionarioId: novoRegistro.funcionarioId,
          tipo: novoRegistro.tipo,
          horario: horarioCompleto,
          observacao: novoRegistro.observacao
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Formatar novo registro para a lista
        const funcionario = funcionarios.find(f => f._id === novoRegistro.funcionarioId);
        const novoRegistroFormatado = {
          id: data.data._id,
          data: new Date(data.data.horario).toLocaleDateString('pt-BR'),
          horario: new Date(data.data.horario).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          nome: funcionario?.nome || 'Funcionário não encontrado',
          pin: 'PIN oculto',
          tipo: data.data.tipo,
          funcionarioId: data.data.funcionario._id
        };

        const atualizados = [novoRegistroFormatado, ...todosRegistros];
        atualizados.sort(multiSort);
        setTodosRegistros(atualizados);
        setRegistros(atualizados);
        setNovoRegistro({ funcionarioId: '', tipo: '', horario: '', observacao: '' });
        alert('Registro adicionado com sucesso!');
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar registro:', error);
      // Fallback para localStorage
      const novo = { 
        ...novoRegistro,
        data: new Date().toLocaleDateString('pt-BR'),
        horario: novoRegistro.horario || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        nome: funcionarios.find(f => f._id === novoRegistro.funcionarioId)?.nome || 'Desconhecido',
        pin: 'local'
      };
      
      const atualizados = [novo, ...todosRegistros];
      atualizados.sort(multiSort);
      setTodosRegistros(atualizados);
      setRegistros(atualizados);
      localStorage.setItem('registros', JSON.stringify(atualizados));
      setNovoRegistro({ funcionarioId: '', tipo: '', horario: '', observacao: '' });
    }
  };

  const editarFuncionario = async (id, index) => {
    const atual = funcionarios[index];
    const nome = prompt('Editar nome:', atual.nome);
    const pin = prompt('Editar PIN:', '******'); // Não mostrar PIN atual por segurança
    
    if (nome && pin) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/funcionarios/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nome, pin })
        });

        const data = await response.json();
        
        if (data.success) {
          const atualizados = [...funcionarios];
          atualizados[index] = { ...atualizados[index], nome };
          setFuncionarios(atualizados);
          alert('Funcionário atualizado com sucesso!');
          carregarDados(); // Recarregar dados
        } else {
          alert(`Erro: ${data.message}`);
        }
      } catch (error) {
        console.error('Erro ao editar funcionário:', error);
        // Fallback para localStorage
        const atualizados = [...funcionarios];
        atualizados[index] = { nome, pin };
        setFuncionarios(atualizados);
        localStorage.setItem('funcionarios', JSON.stringify(atualizados));
        alert('Funcionário atualizado localmente');
      }
    }
  };

  const removerFuncionario = async (id, index) => {
    if (!window.confirm('Tem certeza que deseja desativar este funcionário?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/funcionarios/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        const atualizados = funcionarios.filter((_, i) => i !== index);
        setFuncionarios(atualizados);
        alert('Funcionário desativado com sucesso!');
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao remover funcionário:', error);
      // Fallback para localStorage
      const atualizados = funcionarios.filter((_, i) => i !== index);
      setFuncionarios(atualizados);
      localStorage.setItem('funcionarios', JSON.stringify(atualizados));
      alert('Funcionário removido localmente');
    }
  };

  const editarRegistro = async (registroId, indexGlobal) => {
    const atual = registros[indexGlobal];
    const tipo = prompt('Novo tipo (entrada/saida/entrada_intervalo/saida_intervalo):', atual.tipo);
    
    if (tipo) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/registros/${registroId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tipo })
        });

        const data = await response.json();
        
        if (data.success) {
          const novosReg = [...registros];
          novosReg[indexGlobal] = { 
            ...novosReg[indexGlobal], 
            tipo,
            horario: new Date(data.data.horario).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          };
          novosReg.sort(multiSort);
          setRegistros(novosReg);
          alert('Registro atualizado com sucesso!');
          carregarDados(); // Recarregar dados para garantir sincronização
        } else {
          alert(`Erro: ${data.message}`);
        }
      } catch (error) {
        console.error('Erro ao editar registro:', error);
        // Fallback para localStorage
        const novosReg = [...registros];
        novosReg[indexGlobal] = { ...atual, tipo };
        novosReg.sort(multiSort);
        setRegistros(novosReg);
        alert('Registro atualizado localmente');
      }
    }
  };

  const removerRegistro = async (registroId, indexGlobal) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/registros/${registroId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        const novosReg = registros.filter((_, i) => i !== indexGlobal);
        setRegistros(novosReg);
        alert('Registro removido com sucesso!');
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao remover registro:', error);
      // Fallback para localStorage
      const novosReg = registros.filter((_, i) => i !== indexGlobal);
      setRegistros(novosReg);
      alert('Registro removido localmente');
    }
  };

  // Função de ordenação multi-colunas
  const multiSort = (a, b) => {
    const parseData = d => new Date(d.split('/').reverse().join('-'));
    let res = parseData(b.data) - parseData(a.data); // Data descendente
    if (res === 0) res = a.horario.localeCompare(b.horario);
    if (res === 0) res = a.nome.localeCompare(b.nome);
    if (res === 0) res = a.tipo.localeCompare(b.tipo);
    return res;
  };

  const ordenarPor = (campo) => {
    let direcao = 'asc';
    if (ordenacao.campo === campo && ordenacao.direcao === 'asc') {
      direcao = 'desc';
    }
    setOrdenacao({ campo, direcao });

    const registrosOrdenados = [...registros].sort((a, b) => {
      let valorA = a[campo];
      let valorB = b[campo];

      if (campo === 'data') {
        valorA = new Date(a.data.split('/').reverse().join('-'));
        valorB = new Date(b.data.split('/').reverse().join('-'));
      }
      if (campo === 'horario') {
        valorA = a.horario;
        valorB = b.horario;
      }

      if (valorA < valorB) return direcao === 'asc' ? -1 : 1;
      if (valorA > valorB) return direcao === 'asc' ? 1 : -1;
      return 0;
    });

    setRegistros(registrosOrdenados);
  };

  const totalPaginas = Math.ceil(registros.length / registrosPorPagina);
  const registrosExibidos = registros.slice(
    (paginaAtual - 1) * registrosPorPagina,
    paginaAtual * registrosPorPagina
  );

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-6">
      <style>{`
        @media print {
          body, #root > div {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse;
          }
          table, th, td {
            border: 1px solid black !important;
            color: black !important;
          }
          caption {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
          }
        }
      `}</style>

      <div className="flex justify-between w-full p-4 bg-blue-800 no-print">
        <h1 className="text-xl font-semibold">Admin - Sistema de Ponto Cristal Acquacenter</h1>
        <button onClick={() => navigate('/')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded">🔙 Voltar</button>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4 no-print">
          {error} - Usando dados locais como fallback
        </div>
      )}

      {loading && (
        <div className="text-center py-4 no-print">
          <p>Carregando dados do servidor...</p>
        </div>
      )}

      {/* Gerenciar Funcionários */}
      <div className="bg-white text-black rounded-lg shadow p-4 w-full max-w-2xl mt-4 no-print">
        <h2 className="text-lg font-bold mb-2">Gerenciar Funcionários</h2>
        <div className="flex gap-2 mb-2 flex-wrap">
          <input 
            type="text" 
            placeholder="Nome" 
            value={novoFuncionario.nome} 
            onChange={e => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })} 
            className="border p-2 rounded w-full sm:w-auto" 
          />
          <input 
            type="text" 
            placeholder="PIN (4-6 dígitos)" 
            value={novoFuncionario.pin} 
            onChange={e => setNovoFuncionario({ ...novoFuncionario, pin: e.target.value })} 
            className="border p-2 rounded w-full sm:w-auto" 
          />
          <button 
            onClick={adicionarFuncionario} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Adicionar
          </button>
          <button 
            onClick={carregarDados} 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Atualizar
          </button>
        </div>
        <ul className="space-y-2">
          {funcionarios.map((f, i) => (
            <li key={f._id || i} className="flex justify-between items-center border p-2 rounded">
              <span>{f.nome} {f.cargo ? `(${f.cargo})` : ''} {!f.ativo ? '(Inativo)' : ''}</span>
              <div className="space-x-2">
                <button 
                  onClick={() => editarFuncionario(f._id, i)} 
                  className="bg-yellow-500 px-2 py-1 rounded hover:bg-yellow-600"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => removerFuncionario(f._id, i)} 
                  className="bg-red-500 px-2 py-1 rounded hover:bg-red-600"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap justify-center gap-2 my-4 w-full max-w-4xl no-print">
        <input 
          type="date" 
          value={filtroInicio} 
          onChange={e => setFiltroInicio(e.target.value)} 
          className="p-2 rounded text-black w-full sm:w-auto" 
        />
        <input 
          type="date" 
          value={filtroFim} 
          onChange={e => setFiltroFim(e.target.value)} 
          className="p-2 rounded text-black w-full sm:w-auto" 
        />
        <input 
          type="text" 
          placeholder="Filtrar por nome" 
          value={filtroNome} 
          onChange={e => setFiltroNome(e.target.value)} 
          className="p-2 rounded text-black w-full sm:w-auto" 
        />
        <input 
          type="text" 
          placeholder="Filtrar por PIN" 
          value={filtroPIN} 
          onChange={e => setFiltroPIN(e.target.value)} 
          className="p-2 rounded text-black w-full sm:w-auto" 
        />
        <button 
          onClick={handleBuscar} 
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
        >
          Buscar
        </button>
        <button 
          onClick={handleLimpar} 
          className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
        >
          Limpar
        </button>
      </div>

      {/* Adicionar Registro */}
      <div className="bg-white text-black rounded-lg shadow p-4 w-full max-w-4xl mb-4 no-print">
        <h2 className="text-lg font-bold mb-2">Adicionar Registro Manual</h2>
        <div className="flex flex-wrap gap-2">
          <select 
            value={novoRegistro.funcionarioId} 
            onChange={e => setNovoRegistro({ ...novoRegistro, funcionarioId: e.target.value })} 
            className="p-2 rounded border w-full sm:w-auto"
          >
            <option value="">Selecione o funcionário</option>
            {funcionarios.filter(f => f.ativo).map(f => (
              <option key={f._id} value={f._id}>{f.nome}</option>
            ))}
          </select>
          
          <select 
            value={novoRegistro.tipo} 
            onChange={e => setNovoRegistro({ ...novoRegistro, tipo: e.target.value })} 
            className="p-2 rounded border w-full sm:w-auto"
          >
            <option value="">Tipo</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="entrada_intervalo">Intervalo Ida</option>
            <option value="saida_intervalo">Intervalo Volta</option>
          </select>
          
          <input 
            type="time" 
            value={novoRegistro.horario} 
            onChange={e => setNovoRegistro({ ...novoRegistro, horario: e.target.value })} 
            className="p-2 rounded border w-full sm:w-auto" 
            placeholder="Horário"
          />
          
          <input 
            type="text" 
            placeholder="Observação" 
            value={novoRegistro.observacao} 
            onChange={e => setNovoRegistro({ ...novoRegistro, observacao: e.target.value })} 
            className="p-2 rounded border w-full sm:w-auto" 
          />
          
          <button 
            onClick={adicionarRegistro} 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Botão imprimir */}
      <div className="flex justify-end w-full max-w-4xl mb-2 no-print">
        <button 
          onClick={() => window.print()} 
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          🖨️ Imprimir Tabela
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto w-full max-w-4xl">
        <table className="min-w-full bg-white text-black rounded shadow">
          <caption className="text-lg font-bold p-2">
            Registro de Ponto - Cristal Acquacenter
            <div className="text-sm font-normal">Total: {registros.length} registros</div>
          </caption>
          <thead>
            <tr className="bg-blue-200">
              <th className="p-2 cursor-pointer" onClick={() => ordenarPor('data')}>
                Data {ordenacao.campo === 'data' ? (ordenacao.direcao === 'asc' ? '⬆️' : '⬇️') : ''}
              </th>
              <th className="p-2 cursor-pointer" onClick={() => ordenarPor('horario')}>
                Horário {ordenacao.campo === 'horario' ? (ordenacao.direcao === 'asc' ? '⬆️' : '⬇️') : ''}
              </th>
              <th className="p-2 cursor-pointer" onClick={() => ordenarPor('nome')}>
                Nome {ordenacao.campo === 'nome' ? (ordenacao.direcao === 'asc' ? '⬆️' : '⬇️') : ''}
              </th>
              <th className="p-2 cursor-pointer" onClick={() => ordenarPor('tipo')}>
                Tipo {ordenacao.campo === 'tipo' ? (ordenacao.direcao === 'asc' ? '⬆️' : '⬇️') : ''}
              </th>
              <th className="p-2 no-print">Editar</th>
              <th className="p-2 no-print">Excluir</th>
            </tr>
          </thead>
          <tbody>
            {registrosExibidos.map((r, i) => (
              <tr key={r.id || i} className="border-b hover:bg-gray-50">
                <td className="p-2">{r.data}</td>
                <td className="p-2">{r.horario}</td>
                <td className="p-2">{r.nome}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-white ${
                    r.tipo === 'entrada' ? 'bg-green-500' :
                    r.tipo === 'saida' ? 'bg-red-500' :
                    r.tipo === 'entrada_intervalo' ? 'bg-yellow-500' :
                    r.tipo === 'saida_intervalo' ? 'bg-orange-500' : 'bg-gray-500'
                  }`}>
                    {r.tipo === 'entrada' ? 'Entrada' :
                     r.tipo === 'saida' ? 'Saída' :
                     r.tipo === 'entrada_intervalo' ? 'Intervalo Ida' :
                     r.tipo === 'saida_intervalo' ? 'Intervalo Volta' : r.tipo}
                  </span>
                </td>
                <td className="p-2 no-print">
                  <button 
                    onClick={() => editarRegistro(r.id, (paginaAtual - 1) * registrosPorPagina + i)} 
                    className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500"
                  >
                    ✏️
                  </button>
                </td>
                <td className="p-2 no-print">
                  <button 
                    onClick={() => removerRegistro(r.id, (paginaAtual - 1) * registrosPorPagina + i)} 
                    className="bg-red-400 px-2 py-1 rounded hover:bg-red-500"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-center space-x-2 my-4 no-print">
        <button 
          onClick={() => setPaginaAtual(paginaAtual - 1)} 
          disabled={paginaAtual === 1} 
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="px-4 py-2">{paginaAtual} de {totalPaginas}</span>
        <button 
          onClick={() => setPaginaAtual(paginaAtual + 1)} 
          disabled={paginaAtual === totalPaginas} 
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}