import React, { useState } from 'react'
import { useAppStore } from '../counter-store.js'

// Componente que muestra información del usuario
export const UserDisplay = () => {
  const user = useAppStore(state => state.user)

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #6f42c1',
      borderRadius: '8px',
      margin: '10px',
      backgroundColor: user.theme === 'dark' ? '#2d3748' : '#f8f9ff',
      color: user.theme === 'dark' ? 'white' : 'black'
    }}
    >
      <h3>👤 Información del Usuario</h3>
      <div style={{ marginBottom: '10px' }}>
        <strong>Nombre:</strong> {user.name}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Email:</strong> {user.email}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Tema:</strong> {user.theme === 'light' ? '☀️ Claro' : '🌙 Oscuro'}
      </div>
    </div>
  )
}

// Componente con formulario para editar usuario
export const UserForm = () => {
  const { user, updateUserName, updateUserEmail, toggleTheme } = useAppStore()
  const [tempName, setTempName] = useState(user.name)
  const [tempEmail, setTempEmail] = useState(user.email)

  const handleSubmit = (e) => {
    e.preventDefault()
    updateUserName(tempName)
    updateUserEmail(tempEmail)
  }

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #fd7e14',
      borderRadius: '8px',
      margin: '10px',
      backgroundColor: '#fff8f0'
    }}
    >
      <h3>✏️ Editar Usuario</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nombre:
          </label>
          <input
            type='text'
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email:
          </label>
          <input
            type='email'
            value={tempEmail}
            onChange={(e) => setTempEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type='submit'
            style={{
              padding: '10px 20px',
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            💾 Guardar Cambios
          </button>

          <button
            type='button'
            onClick={toggleTheme}
            style={{
              padding: '10px 20px',
              backgroundColor: user.theme === 'light' ? '#343a40' : '#ffc107',
              color: user.theme === 'light' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {user.theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UserForm
