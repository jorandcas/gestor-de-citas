
export default function PaypalCancel() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
                <svg className="w-20 h-20 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-6 6M9 9l6 6" />
                </svg>
                <h1 className="text-3xl font-bold text-red-600 mb-2">Pago cancelado</h1>
                <p className="text-gray-700 mb-6">El proceso de pago fue cancelado. Si fue un error, puedes intentarlo nuevamente.</p>
                <a
                    href="/"
                    className="mt-6 inline-block bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded transition"
                >
                    Volver al inicio
                </a>
            </div>
        </div>
    )
}
