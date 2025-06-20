import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://backend-ponto-digital-1.onrender.com';

function AdminPage() {
  const [registros, setRegistros] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [statusFuncionarios, setStatusFuncionarios] = useState([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [editandoFuncionario, setEditandoFuncionario] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [editPin, setEditPin] = useState('');

  useEffect(() => {
    buscarDados();
  }, []);

  useEffect(() => {
    calcularStatusFuncionarios();
  }, [registros, funcionarios]);

  const buscarDados = async () => {
    try {
      const [regRes, funcRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/registros`),
        axios.get(`${API_BASE_URL}/funcionarios`),
      ]);
      setRegistros(regRes.data);
      setFuncionarios(funcRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const calcularStatusFuncionarios = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const registrosHoje = registros.filter(r => r.data === hoje);
    const statusMap = {};
    registrosHoje.forEach(r => {
      statusMap[r.nome] = r.tipo;
    });
    const lista = funcionarios.map(f => ({
      nome: f.nome,
      status: statusMap[f.nome] === 'entrada' ? 'Presente' : 'Ausente',
    }));
    setStatusFuncionarios(lista);
  };

  const iniciarEdicaoFuncionario = (func) => {
    setEditandoFuncionario(func._id);
    setEditNome(func.nome);
    setEditPin(func.pin);
  };

  const salvarEdicaoFuncionario = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/funcionarios/${id}`, {
        nome: editNome,
        pin: editPin,
      });
      buscarDados();
      setEditandoFuncionario(null);
    } catch (err) {
      console.error('Erro ao editar funcionário', err);
    }
  };

  const excluirFuncionario = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/funcionarios/${id}`);
      buscarDados();
    } catch (err) {
      console.error('Erro ao excluir funcionário', err);
    }
  };

  const filtrarRegistros = () => {
    if (!dataInicio || !dataFim) return registros;
    return registros.filter((r) => r.data >= dataInicio && r.data <= dataFim);
  };

  const imprimirTabela = () => {
    const conteudo = document.getElementById('tabela-registros').outerHTML;
    const janela = window.open('', '', 'height=800,width=1000');
    janela.document.write('<html><head><title>Impressão</title>');
    janela.document.write('<style>table, th, td { border: 1px solid black; border-collapse: collapse; padding: 8px; } h2 { text-align: center; }</style>');
    janela.document.write('</head><body>');
    janela.document.write('<h2>Registro de ponto - Cristal Acquacenter</h2>');
    janela.document.write(conteudo);
    janela.document.write('</body></html>');
    janela.document.close();
    janela.print();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', position: 'relative' }}>
      <button
        onClick={() => window.location.href = '/'}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 14px',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Voltar
      </button>

      <h1>Área Administrativa</h1>

      <div style={{
        background: '#f0f8ff',
        border: '1px solid #007bff',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>Status dos Funcionários Hoje</h3>
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {statusFuncionarios.map((f, idx) => (
            <li key={idx} style={{ margin: '5px 0' }}>
              {f.nome} - {f.status === 'Presente' ? '✅ Presente' : '❌ Ausente'}
            </li>
          ))}
        </ul>
      </div>

      <h3>Gerenciar Funcionários</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th style={thStyle}>Nome</th>
            <th style={thStyle}>PIN</th>
            <th style={thStyle}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {funcionarios.map((f, idx) => (
            <tr key={idx}>
              <td style={tdStyle}>
                {editandoFuncionario === f._id ? (
                  <input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                ) : f.nome}
              </td>
              <td style={tdStyle}>
                {editandoFuncionario === f._id ? (
                  <input value={editPin} onChange={(e) => setEditPin(e.target.value)} />
                ) : f.pin}
              </td>
              <td style={tdStyle}>
                {editandoFuncionario === f._id ? (
                  <>
                    <button onClick={() => salvarEdicaoFuncionario(f._id)}>Salvar</button>{' '}
                    <button onClick={() => setEditandoFuncionario(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => iniciarEdicaoFuncionario(f)}>Editar</button>{' '}
                    <button onClick={() => excluirFuncionario(f._id)}>Excluir</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Relatórios</h3>
      <div style={{ marginBottom: '15px' }}>
        <label>Data Início: </label>
        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        <label style={{ marginLeft: '10px' }}>Data Fim: </label>
        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        <button onClick={buscarDados} style={{ marginLeft: '10px' }}>Buscar</button>
        <button onClick={() => { setDataInicio(''); setDataFim(''); }} style={{ marginLeft: '5px' }}>Limpar</button>
        <button onClick={imprimirTabela} style={{ marginLeft: '5px' }}>Imprimir</button>
      </div>

      <div id="tabela-registros">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Nome</th>
              <th style={thStyle}>Data</th>
              <th style={thStyle}>Hora</th>
              <th style={thStyle}>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {filtrarRegistros().map((r, idx) => (
              <tr key={idx}>
                <td style={tdStyle}>{r.nome}</td>
                <td style={tdStyle}>{r.data}</td>
                <td style={tdStyle}>{r.hora}</td>
                <td style={tdStyle}>{r.tipo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  border: '1px solid #ddd',
  padding: '8px',
  backgroundColor: '#e6f0ff',
  textAlign: 'left'
};

const tdStyle = {
  border: '1px solid #ddd',
  padding: '8px'
};

export default AdminPage;
