import React, { useState } from 'react';

const teclas = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['Limpar', '0', 'OK'],
];

export default function PinKeyboard({ onDigit, onClear, onSubmit }) {
  const [input, setInput] = useState('');

  const handleClick = (tecla) => {
    if (tecla === 'Limpar') {
      setInput(''); // Limpa o campo
      return onClear?.();
    }
    if (tecla === 'OK') {
      onSubmit?.(input);
      return setInput(''); // Limpa após envio
    }
    const novoInput = input + tecla;
    setInput(novoInput); // Atualiza o PIN digitado
    onDigit?.(tecla);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      {/* Exibição do PIN digitado */}
      <input
        type="text"
        value={input}
        readOnly
        className="w-full text-center text-3xl font-semibold py-4 mb-6 rounded-lg border-2 border-blue-700 bg-blue-50"
        placeholder="Digite seu PIN"
      />

      {/* Teclado */}
      <div className="grid grid-cols-3 gap-4">
        {teclas.flat().map((tecla, index) => (
          <button
            key={index}
            onClick={() => handleClick(tecla)}
            className="py-4 text-xl font-semibold rounded-xl shadow-md transition duration-200 ease-in-out transform bg-white text-blue-700 hover:bg-blue-50 hover:scale-105 active:scale-95"
          >
            {tecla}
          </button>
        ))}
      </div>
    </div>
  );
}
