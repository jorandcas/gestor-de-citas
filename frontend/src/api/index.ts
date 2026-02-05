import axios from 'axios';

// Crea una instancia de Axios con una configuración base
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // URL base para todas las peticiones
  timeout: 5000, // Tiempo de espera en milisegundos
  headers: {
    'Content-Type': 'application/json',
    // 'Authorization': 'Bearer ' + 'tu-token-aqui', // Ejemplo de token de autorización
  },
});

export { apiClient };
