import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { toast } from 'react-toastify'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token')
      if (token) {
        const newSocket = io('http://localhost:5000', {
          auth: { token }
        })

        newSocket.on('connect', () => {
          setConnected(true)
          console.log('Connected to server')
        })

        newSocket.on('disconnect', () => {
          setConnected(false)
          console.log('Disconnected from server')
        })

        newSocket.on('error', (error) => {
          console.error('Socket error:', error)
          toast.error(error.message)
        })

        newSocket.on('conflict', (data) => {
          toast.warn('Conflict detected! Another user has modified this task.')
          // Handle conflict in the component that initiated the update
        })

        setSocket(newSocket)

        return () => {
          newSocket.close()
        }
      }
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
        setConnected(false)
      }
    }
  }, [user])

  const value = {
    socket,
    connected
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}