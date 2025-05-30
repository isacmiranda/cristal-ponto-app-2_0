import React, { useEffect, useState } from 'react'; 
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const [registros, setRegistros] = useState([]);
  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFim, setFiltroFim] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroPIN, setFiltroPIN] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', pin: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const localRegistros = localStorage.getItem('registros');
    const localFuncionarios = localStorage.getItem('funcionarios');
    if (localRegistros) setRegistros(JSON.parse(localRegistros));
    if (localFuncionarios) setFuncionarios(JSON.parse(localFuncionarios));
  }, []);

  const handleBuscar = () => {
    const inicio = new Date(filtroInicio);
    const fim = new Date(filtroFim);
    const todos = JSON.parse(localStorage.getItem('registros') || '[]');
    const filtrados = todos.filter(r => {
      const data = new Date(r.data.split('/').reverse().join('-'));
      const matchData = (!filtroInicio || data >= inicio) && (!filtroFim || data <= fim);
      const matchNome = !filtroNome || r.nome.toLowerCase().includes(filtroNome.toLowerCase());
      const matchPIN = !filtroPIN || r.pin.includes(filtroPIN);
      return matchData && matchNome && matchPIN;
    });
    setRegistros(filtrados);
  };

  const handleLimpar = () => {
    const local = localStorage.getItem('registros');
    if (local) setRegistros(JSON.parse(local));
    setFiltroInicio('');
    setFiltroFim('');
    setFiltroNome('');
    setFiltroPIN('');
  };

  const adicionarFuncionario = () => {
    if (!novoFuncionario.nome || !novoFuncionario.pin) return;
    const atualizados = [...funcionarios, novoFuncionario];
    setFuncionarios(atualizados);
    localStorage.setItem('funcionarios', JSON.stringify(atualizados));
    setNovoFuncionario({ nome: '', pin: '' });
  };

  const editarFuncionario = (index) => {
    const atual = funcionarios[index];
    const nome = prompt('Editar nome:', atual.nome);
    const pin = prompt('Editar PIN:', atual.pin);
    if (nome && pin) {
      const atualizados = [...funcionarios];
      atualizados[index] = { nome, pin };
      setFuncionarios(atualizados);
      localStorage.setItem('funcionarios', JSON.stringify(atualizados));
    }
  };

  const removerFuncionario = (index) => {
    const atualizados = funcionarios.filter((_, i) => i !== index);
    setFuncionarios(atualizados);
    localStorage.setItem('funcionarios', JSON.stringify(atualizados));
  };

  const editarRegistro = (index) => {
    const horario = prompt('Novo horário:', registros[index].horario);
    const tipo = prompt('Novo tipo (entrada/saida):', registros[index].tipo);
    if (horario && tipo) {
      const atualizados = [...registros];
      atualizados[index].horario = horario;
      atualizados[index].tipo = tipo;
      setRegistros(atualizados);
      localStorage.setItem('registros', JSON.stringify(atualizados));
    }
  };

  const removerRegistro = (index) => {
    const atualizados = registros.filter((_, i) => i !== index);
    setRegistros(atualizados);
    localStorage.setItem('registros', JSON.stringify(atualizados));
  };

  const imprimir = () => {
    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head><title>Impressão</title></head>
        <body>
          <h1 style="text-align:center">Registro de Ponto Cristal Acquacenter</h1>
          <table border="1" style="width:100%; border-collapse: collapse">
            <thead>
              <tr><th>Data</th><th>Horário</th><th>Nome</th><th>Tipo</th></tr>
            </thead>
            <tbody>
              ${registros.map(r => `
                <tr>
                  <td>${r.data || 'Não disponível'}</td>
                  <td>${r.horario || 'Não disponível'}</td>
                  <td>${r.nome || 'Não disponível'}</td>
                  <td>${r.tipo || 'Não disponível'}</td>
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

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-6">
      <div className="flex justify-between w-full p-4 bg-blue-800">
        <h1 className="text-xl font-semibold">Admin - Sistema de Ponto Cristal Acquacenter</h1>
        <button onClick={() => navigate('/')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded">🔙</button>
      </div>

      <div className="bg-white text-black rounded-lg shadow p-4 w-full max-w-2xl mt-4">
        <h2 className="text-lg font-bold mb-2">Gerenciar Funcionários</h2>
        <div className="flex gap-2 mb-2">
          <input type="text" placeholder="Nome" value={novoFuncionario.nome} onChange={e => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })} className="border p-2 rounded w-full" />
          <input type="text" placeholder="PIN" value={novoFuncionario.pin} onChange={e => setNovoFuncionario({ ...novoFuncionario, pin: e.target.value })} className="border p-2 rounded w-full" />
          <button onClick={adicionarFuncionario} className="bg-blue-600 text-white px-4 py-2 rounded">Adicionar</button>
        </div>
        <ul className="space-y-2">
          {funcionarios.map((f, i) => (
            <li key={i} className="flex justify-between items-center border p-2 rounded">
              <span>{f.nome} (PIN: {f.pin})</span>
              <div className="space-x-2">
                <button onClick={() => editarFuncionario(i)} className="bg-yellow-500 px-2 py-1 rounded">✏️</button>
                <button onClick={() => removerFuncionario(i)} className="bg-red-500 px-2 py-1 rounded">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap justify-center gap-2 my-4 w-full max-w-4xl">
        <input type="date" value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)} className="p-2 rounded text-black" />
        <input type="date" value={filtroFim} onChange={e => setFiltroFim(e.target.value)} className="p-2 rounded text-black" />
        <input type="text" placeholder="Filtrar por nome" value={filtroNome} onChange={e => setFiltroNome(e.target.value)} className="p-2 rounded text-black" />
        <input type="text" placeholder="Filtrar por PIN" value={filtroPIN} onChange={e => setFiltroPIN(e.target.value)} className="p-2 rounded text-black" />
        <button onClick={handleBuscar} className="bg-green-600 px-4 py-2 rounded">Buscar</button>
        <button onClick={handleLimpar} className="bg-gray-600 px-4 py-2 rounded">Limpar</button>
        <button onClick={imprimir} className="bg-indigo-600 px-4 py-2 rounded">🖨️ Imprimir</button>
      </div>

      <div className="overflow-x-auto w-full max-w-4xl">
        <table className="min-w-full bg-white text-black rounded shadow">
          <thead>
            <tr className="bg-blue-200">
              <th className="p-2">Data</th>
              <th className="p-2">Horário</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Editar</th>
              <th className="p-2">Excluir</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{r.data || 'Não disponível'}</td>
                <td className="p-2">{r.horario || 'Não disponível'}</td>
                <td className="p-2">{r.nome || 'Não disponível'}</td>
                <td className="p-2">{r.tipo || 'Não disponível'}</td>
                <td className="p-2">
                  <button onClick={() => editarRegistro(i)} className="bg-yellow-400 px-2 py-1 rounded">✏️</button>
                </td>
                <td className="p-2">
                  <button onClick={() => removerRegistro(i)} className="bg-red-400 px-2 py-1 rounded">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
