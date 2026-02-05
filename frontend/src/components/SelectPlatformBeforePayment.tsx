import { useSettings } from "@/hooks/useSettings.tsx";
import { useSelectPlatformBeforePayment } from "@/hooks/useSelectPlatformBeforePayment.tsx";
import { Video } from "lucide-react";
import { motion } from "motion/react";

export const SelectPlatformBeforePayment = () => {
    const { allMeetingPlatforms } = useSettings();
    const { handleSelectPlatformBeforePayment } = useSelectPlatformBeforePayment();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {!allMeetingPlatforms ? (
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-gray-600"
                    >
                        Cargando plataformas de reunión...
                    </motion.div>
                </div>
            ) : allMeetingPlatforms.MeetingPlatforms.length === 0 ? (
                <div className="text-black text-center">
                    No hay plataformas de reunión disponibles.
                </div>
            ) : (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white p-8 rounded-lg shadow-lg w-full max-w-xl"
                >
                    <h1 className="text-4xl font-bold mb-6 text-center text-[#bd9554]">
                        Selecciona una plataforma de reunión
                    </h1>
                    <p className="text-gray-500 text-center mb-6">
                        Por favor, selecciona una de las siguientes plataformas para tu cita.
                        El link de la reunión se generará automáticamente después de completar el pago.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {allMeetingPlatforms.MeetingPlatforms.filter(
                            (met) => met.is_active === true
                        ).map((platform) => (
                            <button
                                key={platform.id}
                                className="border border-[#bd9554] p-4 rounded hover:shadow-md hover:scale-105 cursor-pointer transition-all"
                                onClick={(e) =>
                                    handleSelectPlatformBeforePayment(
                                        e,
                                        platform.id
                                    )
                                }
                            >
                                <div className="flex items-center gap-2">
                                    <div className="ml-2">
                                        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                                            <Video
                                                className="text-[#bd9554]"
                                                size={30}
                                            />
                                            {platform.name}
                                        </h2>
                                        <p className="text-gray-600 text-sm">
                                            {platform.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                            <strong>Nota:</strong> Podrás continuar con el pago después de seleccionar la plataforma.
                            El link de la reunión se enviará automáticamente una vez confirmado el pago.
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
