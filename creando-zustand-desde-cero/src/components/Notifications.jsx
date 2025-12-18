import React from 'react'
import { useAppStore } from '../counter-store.js'

// Componente que muestra notificaciones
export const NotificationPanel = () => {
  const { notifications, removeNotification } = useAppStore(state => ({
    notifications: state.ui.notifications,
    removeNotification: state.removeNotification
  }))

  if (notifications.length === 0) {
    return (
      <div style={{
        padding: '15px',
        border: '2px solid #e9ecef',
        borderRadius: '8px',
        margin: '10px',
        backgroundColor: '#f8f9fa',
        color: '#6c757d',
        textAlign: 'center'
      }}
      >
        📭 No hay notificaciones
      </div>
    )
  }

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #17a2b8',
      borderRadius: '8px',
      margin: '10px',
      backgroundColor: '#e6f3ff'
    }}
    >
      <h3>🔔 Notificaciones ({notifications.length})</h3>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={{
              padding: '10px',
              margin: '5px 0',
              backgroundColor: 'white',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '25px',
                height: '25px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente para agregar notificaciones
export const NotificationControls = () => {
  const addNotification = useAppStore(state => state.addNotification)

  const messages = [
    '¡Bienvenido a la aplicación!',
    'El contador ha sido actualizado',
    'Datos del usuario guardados',
    'Nueva funcionalidad disponible',
    'Sistema funcionando correctamente'
  ]

  const addRandomNotification = () => {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    addNotification(randomMessage)
  }

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #20c997',
      borderRadius: '8px',
      margin: '10px',
      backgroundColor: '#e8f8f5'
    }}
    >
      <h3>🎯 Controles de Notificaciones</h3>
      <button
        onClick={addRandomNotification}
        style={{
          padding: '10px 20px',
          backgroundColor: '#20c997',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ➕ Agregar Notificación
      </button>
    </div>
  )
}

export default NotificationPanel
