import usePaypal from '@/hooks/usePaypal'
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PaypalSucces() {
  const { loading, dataPayment, id } = usePaypal()
  const navigate = useNavigate();

  // Redirigir automáticamente al dashboard después de 3 segundos
  useEffect(() => {
    if (!loading && dataPayment?.status === 'COMPLETED') {
      const timer = setTimeout(() => {
        navigate("/user/appointments");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loading, dataPayment, navigate]);

  const appointmentId = id;
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {loading ?
        <div>Espere un momento estamos obteniendo el pago...</div>
        : (
          <div>
            {dataPayment ?
              (
              <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
                <svg className="w-20 h-20 text-green-500 mb-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2l4-4" />
                </svg>
                <h1 className="text-3xl font-bold text-green-600 mb-2">¡Pago realizado con éxito!</h1>
                <p className="text-gray-700 mb-6">Gracias por tu
                  compra, {dataPayment.payment_source.paypal.name.given_name + " " + dataPayment.payment_source.paypal.name.surname || "usuario"}.</p>
                <div className="text-left text-gray-800 w-full max-w-xs ">
                  <p className='text-wrap break-words'><span
                    className="font-semibold break-words">Operación:</span> {dataPayment.id}</p>
                  <p><span
                    className="font-semibold">Monto:</span> ${parseFloat(dataPayment.purchase_units[0].payments.captures[0].amount.value).toFixed(2)}
                  </p>
                  <p><span className="font-semibold">Estado:</span> {dataPayment.status}</p>
                  <p><span
                    className="font-semibold">Email:</span> {dataPayment.payer.email_address}
                  </p>
                </div>
                <p className="text-gray-700 mt-6 mb-6 text-primary font-bold">Nos estaremos comunicando
                  contigo en breve.</p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>✅ El link de la reunión se ha generado automáticamente.</strong>
                  </p>
                  <p className="text-sm text-blue-800">
                    Serás redirigido a tus citas en unos segundos...
                  </p>
                </div>
                <button
                  onClick={() => navigate("/user/appointments")}
                  className="mt-6 inline-block bg-[#bd9554] hover:bg-[#a78343] text-white font-semibold py-2 px-6 rounded transition"
                >
                  Ir a mis citas
                </button>
              </div>) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4 text-red-600">Error al procesar el pago</h2>
                <p className="text-lg">No se pudo obtener la información del pago.</p>
              </div>

            )}
          </div>
        )}
    </div>
  )
}
