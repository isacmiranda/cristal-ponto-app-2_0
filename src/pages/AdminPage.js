import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const navigate = useNavigate(); // Navegação para outras páginas
  const [funcionarios, setFuncionarios] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', pin: '' });
  const [editandoFuncionario, setEditandoFuncionario] = useState(null);

  useEffect(() => {
    const funcionariosSalvos = JSON.parse(localStorage.getItem('funcionarios') || '[]');
    const registrosSalvos = JSON.parse(localStorage.getItem('registros') || '[]');
    setFuncionarios(funcionariosSalvos);
    setRegistros(registrosSalvos);
  }, []);

  // Funções de CRUD de Funcionários
  const adicionarFuncionario = () => {
    if (!novoFuncionario.nome || !novoFuncionario.pin) {
      alert('Por favor, preencha todos os campos');
      return;
    }
    const funcionariosAtualizados = [...funcionarios, novoFuncionario];
    setFuncionarios(funcionariosAtualizados);
    localStorage.setItem('funcionarios', JSON.stringify(funcionariosAtualizados));
    setNovoFuncionario({ nome: '', pin: '' });
  };

  const editarFuncionario = (funcionario) => {
    setEditandoFuncionario(funcionario);
    setNovoFuncionario(funcionario);
  };

  const salvarEdicaoFuncionario = () => {
    const funcionariosAtualizados = funcionarios.map(f =>
      f.pin === editandoFuncionario.pin ? novoFuncionario : f
    );
    setFuncionarios(funcionariosAtualizados);
    localStorage.setItem('funcionarios', JSON.stringify(funcionariosAtualizados));
    setNovoFuncionario({ nome: '', pin: '' });
    setEditandoFuncionario(null);
  };

  const excluirFuncionario = (pin) => {
    const funcionariosAtualizados = funcionarios.filter(f => f.pin !== pin);
    setFuncionarios(funcionariosAtualizados);
    localStorage.setItem('funcionarios', JSON.stringify(funcionariosAtualizados));
  };

  // Função de exclusão de Registros
  const excluirRegistro = (id) => {
    const registrosAtualizados = registros.filter(r => r.id !== id);
    setRegistros(registrosAtualizados);
    localStorage.setItem('registros', JSON.stringify(registrosAtualizados));
  };

  const handleBack = () => {
    navigate('/'); // Navega para a página de PIN
  };

  // Função de impressão
  const imprimirRelatorio = () => {
    const conteudo = document.getElementById('tabela-registros').outerHTML;
    const janela = window.open('', '', 'height=600,width=800');
    janela.document.write('<html><head><title>Folha de ponto - Cristal Acquacenter</title></head><body>');
    janela.document.write('<h1 style="text-align: center;">Folha de ponto - Cristal Acquacenter</h1>');
    janela.document.write(conteudo);
    janela.document.write('</body></html>');
    janela.document.close();
    janela.print();
  };

  // Função para formatar a data de forma segura
  const formatarData = (data) => {
    const parsedDate = new Date(data);
    return !isNaN(parsedDate) ? parsedDate.toLocaleDateString() : 'Data Inválida';
  };

  // Função para formatar a hora
  const formatarHora = (hora) => {
    if (!hora) return 'Hora Inválida';
    const parsedHora = new Date(`1970-01-01T${hora}:00Z`); // Formato correto ISO
    return !isNaN(parsedHora) ? parsedHora.toLocaleTimeString() : 'Hora Inválida';
  };

  return (
    <div className="p-6 min-h-screen bg-blue-50">
      <h1 className="text-2xl font-bold text-center mb-4">Área Administrativa</h1>

      {/* Botão de Voltar */}
      <button
        onClick={handleBack}
        className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4"
      >
        Voltar para o Ponto
      </button>

      {/* Formulário para adicionar ou editar funcionário */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">{editandoFuncionario ? 'Editar Funcionário' : 'Adicionar Funcionário'}</h2>
        <input
          type="text"
          value={novoFuncionario.nome}
          onChange={(e) => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })}
          placeholder="Nome"
          className="border p-2 rounded-md w-full mb-2"
        />
        <input
          type="text"
          value={novoFuncionario.pin}
          onChange={(e) => setNovoFuncionario({ ...novoFuncionario, pin: e.target.value })}
          placeholder="PIN"
          className="border p-2 rounded-md w-full mb-2"
        />
        <button
          onClick={editandoFuncionario ? salvarEdicaoFuncionario : adicionarFuncionario}
          className="bg-green-500 text-white px-4 py-2 rounded-md"
        >
          {editandoFuncionario ? 'Salvar Alterações' : 'Adicionar Funcionário'}
        </button>
      </div>

      {/* Lista de funcionários */}
      <h2 className="text-xl mb-4">Funcionários Cadastrados</h2>
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2">Nome</th>
            <th className="border px-4 py-2">PIN</th>
            <th className="border px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {funcionarios.map((funcionario) => (
            <tr key={funcionario.pin}>
              <td className="border px-4 py-2">{funcionario.nome}</td>
              <td className="border px-4 py-2">{funcionario.pin}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => editarFuncionario(funcionario)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-md mr-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => excluirFuncionario(funcionario.pin)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botão Imprimir */}
      <button
        onClick={imprimirRelatorio}
        className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
      >
        Imprimir Relatório
      </button>

      {/* Lista de registros */}
      <h2 className="text-xl mt-6 mb-4">Registros de Ponto</h2>
      <table id="tabela-registros" className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2">Nome</th>
            <th className="border px-4 py-2">Data</th>
            <th className="border px-4 py-2">Hora</th>
            <th className="border px-4 py-2">Tipo</th>
            <th className="border px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((registro) => (
            <tr key={registro.id}>
              <td className="border px-4 py-2">{registro.nome}</td>
              <td className="border px-4 py-2">{formatarData(registro.data)}</td>
              <td className="border px-4 py-2">{formatarHora(registro.hora)}</td>
              <td className="border px-4 py-2">{registro.tipo}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => excluirRegistro(registro.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPage;
