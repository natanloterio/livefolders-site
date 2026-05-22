'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [label, setLabel] = useState('[copy]')

  async function handleClick() {
    await navigator.clipboard.writeText(text)
    setLabel('[copied!]')
    setTimeout(() => setLabel('[copy]'), 2000)
  }

  return (
    <button
      onClick={handleClick}
      style={{
        marginLeft: '0.6rem',
        fontFamily: 'inherit',
        fontSize: '0.8rem',
        background: '#000',
        color: '#0f0',
        border: '1px solid #0f0',
        padding: '0.1rem 0.4rem',
        cursor: 'pointer',
        verticalAlign: 'middle',
      }}
    >
      {label}
    </button>
  )
}
