import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AppointmentInterface } from '@/types';
import { apiClient } from '@/api';
import toast from 'react-hot-toast';

const Payment = ({ appointmentData }: { appointmentData: AppointmentInterface | null }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Format the appointment date and time
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleCreateOrder = async () => {
    if (!appointmentData) {
      toast.error('No hay datos de cita disponibles');
      return;
    }
    
    try {
      const res = await apiClient.post('/payments', {
        appointmentId: appointmentData.id,
        clientName: name,
        clientEmail: email,
      });

      
      return res.data.id;
    } catch (error) {
      console.error('Error al crear la orden de pago:', error);
      toast.error('Error al crear la orden de pago');
      throw error;
    }
  };

  // const handleApprove = async (data: any, actions: any) => {
  //   try {
  //     // Here you would typically send the payment details to your backend
  //     // and update the appointment status
  //     console.log('Payment successful:', data);
      
  //     // Example API call to update appointment status
  //     // await apiClient.patch(`/appointments/${appointmentData.id}`, {
  //     //   status: 'reservado',
  //     //   client_name: name,
  //     //   client_email: email,
  //     //   payment_id: data.paymentID
  //     // });
      
  //     alert('¡Pago exitoso! Su cita ha sido reservada.');
  //   } catch (error) {
  //     console.error('Error processing payment:', error);
  //   }
  // };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Confirmación de Pago</h1>
      
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Detalles de la Cita</h2>
        <div className="grid md:grid-cols-2 gap-4">
            {appointmentData && appointmentData.day ? (
            <>
                <div>
                    <p className="text-sm text-gray-600">Fecha:</p>
                    <p className="font-medium">{formatDate(appointmentData.day)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">Horario:</p>
                    <p className="font-medium">
                    {appointmentData.start_time} - {appointmentData.end_time}
                    </p>
                </div>
            </>
            ) : (
                <p>No hay ninguna fecha seleccionada</p>
            )}
          
        </div>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Información del Cliente</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Resumen del Pago</h2>
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">Costo de la consulta:</p>
          <p className="font-semibold">$1,000.00 MXN</p>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-lg font-bold">Total:</p>
            <p className="text-xl font-bold text-blue-600">$1,000.00 MXN</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center items-center">
        <PayPalScriptProvider options={{ 
          clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test',
          currency: 'MXN',
          locale: 'es_MX'
        }}>
          <PayPalButtons
            style={{ layout: 'vertical',label:'pay' }}
            className='w-full max-w-auto'
            disabled={!name || !email}
            createOrder={handleCreateOrder}
            // onApprove={handleApprove}
            onError={(err) => {
              console.error('PayPal error:', err);
            }}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
};

export default Payment;
