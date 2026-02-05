import {motion} from 'framer-motion';
import WeeklySchedule from '@/components/WeeklySchedule';
import ArrowIcon from '@/components/icons/arrow';
import {SignInButton, UserButton} from '@clerk/clerk-react';
import { useSettings } from '@/hooks/useSettings';

export const Home = ({session}: {
    session: any
}) => {
    const {allSettings}=useSettings();
    const phoneNumber = allSettings?.configs.find(config => config.key === 'phone')?.value;
    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.3}}
            className="min-h-screen flex flex-col justify-center items-center bg-white py-8"
        >
            <ArrowIcon size={35} className="text-primary relative -top-19 animate-bounce"/>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-[#1e1e1e] sm:text-4xl">
                        Bienvenido a <span className='text-[#bd9554]'>Becerra Manchinelly</span>
                    </h1>
                    <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                        Selecciona un horario disponible para tu cita
                    </p>
                </div>

                <motion.div
                    initial={{y: 20, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{delay: 0.2, duration: 0.5}}
                    className="bg-white rounded-lg overflow-hidden"
                >
                    <WeeklySchedule />
                </motion.div>

                <div className="mt-8 text-center text-sm text-gray-500 flex items-center justify-center space-x-2">
                    <p>¿Necesitas ayuda? Contáctanos al</p> <button className='px-4 py-2 bg-green-600 rounded-full text-white hover:bg-green-700' onClick={() => {
                    window.open(`https://wa.me/${phoneNumber}`, '_blank');
                }}>
                        {phoneNumber}
                    </button>
                </div>
                {session?.user ? (
                    <div className="mt-8 flex justify-center items-center w-full space-x-2">
                        <UserButton/>
                        <div className='p-4 text-blue-600 cursor-pointer max-w-[220px] rounded-md hover:bg-blue-600 hover:text-white transition duration-300'>
                            <a href='/user/appointments'>Ver mis Citas</a>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 flex justify-center items-center w-full space-x-2">
                        <span className='text-gray-700'>¿No tienes cuenta?</span>
                        <SignInButton mode="modal" appearance={{
                            elements: {
                                input: {
                                    padding: "18px 8px",
                                    borderRadius: "0",
                                },
                                button: {
                                    color: "primary",
                                    borderRadius: "0",
                                    padding: "15px 8px",
                                    fontSize: "0.7rem",
                                    fontWeight: "regular",
                                    textTransform: "uppercase",
                                    letterSpacing: "1px",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s ease-in-out",
                                    "&:hover": {
                                        backgroundColor: "#bd9554",
                                    },
                                },
                            },
                        }}>
                            <motion.button
                                initial={{y: -100, opacity: 0}}
                                animate={{y: 0, opacity: 1}}
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                className="cursor-pointer text-blue-600 max-w-[220px]">Iniciar Sesión
                            </motion.button>
                        </SignInButton>

                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Home;
