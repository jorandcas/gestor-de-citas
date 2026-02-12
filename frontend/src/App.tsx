import { Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Home from './pages/Home';
import AdminApp from './components/Reservation';
import { useSession } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { AppointmentInterface } from './types';
import DashboardUser from './components/DashboardUser';
import DashboardUserHistory from './components/DashboardUserHistory';
import { Layout } from './components/Layout';
import ExternalPayment from "./components/ExternalPayment";
import ManagementOfManualPayment from './components/ManagementOfManualPayment';
import SelectMethodOfPayment from "@/components/SelectMethodOfPayment.tsx";
import StripePayment from "@/components/StripePayment.tsx";
import Success from "@/components/StripeSucces.tsx";
import StripeCancel from "@/components/StripeCancel.tsx";
import { ManagementPaymentStripe } from "@/components/managementPaymentStripe.tsx";
import { SettingsAdmin } from "@/components/Settings.tsx";
import { CreateLinkOfAppointment } from "@/components/CreateLinkOfAppointment.tsx";
import { SelectPlatfomOfAppointment } from "@/components/SelectPlatfomOfAppointment.tsx";
import ManagementOfAppointment from './components/ManagementOfAppointment';
import PaypalPayment from './components/PaypalPayment';
import PaypalSucces from './components/PaypalSucces';
import PaypalCancel from './components/PaypalCancel';
import ManagementPaypalPayment from './components/ManagementPaypalPayment';


function App() {

    const { session } = useSession();
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentInterface | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<number | null>(null);
    const location = useLocation();
    const isHomePage = location.pathname === "/";

    // Cargar siempre desde localStorage cuando cambia la ruta
    useEffect(() => {
        const storedAppointment = localStorage.getItem('selectedAppointment');
        if (storedAppointment) {
            const parsed = JSON.parse(storedAppointment);
            console.log("🔄 Cargando cita desde localStorage:", parsed);
            setSelectedAppointment(parsed);
        } else {
            setSelectedAppointment(null);
        }

        // Cargar plataforma seleccionada
        const storedPlatform = localStorage.getItem('selectedPlatform');
        if (storedPlatform) {
            const platformId = parseInt(storedPlatform);
            console.log("🔄 Cargando plataforma desde localStorage:", platformId);
            setSelectedPlatform(platformId);
        } else {
            setSelectedPlatform(null);
        }
    }, [location.pathname]); // Se ejecuta cuando cambia la ruta

    useEffect(() => {
        localStorage.setItem('selectedAppointment', JSON.stringify(selectedAppointment));
    }, [selectedAppointment]);

    useEffect(() => {
        if (selectedPlatform !== null) {
            localStorage.setItem('selectedPlatform', JSON.stringify(selectedPlatform));
        }
    }, [selectedPlatform]);
    return (
        <div>
            {session?.user && session?.publicUserData?.identifier === adminEmail ? (
                <main className="main" style={{
                    minHeight: 'calc(100vh - 70px)'
                }}>
                    <Layout>
                        <Routes>
                            <Route path="/" element={
                                <AdminApp />
                            } />
                            <Route
                                path="/management-of-external-payment"
                                element={
                                    <ManagementOfManualPayment selectedAppointment={selectedAppointment} />
                                }
                            />
                            <Route
                                path='/management-of-paypal'
                                element={
                                    <ManagementPaypalPayment />
                                }
                            />
                            <Route
                                path="/management-of-stripe"
                                element={
                                    <ManagementPaymentStripe />
                                }
                            />
                            <Route
                                path='/management-appointments'
                                element={<ManagementOfAppointment />}
                            />
                            <Route
                                path='/meeting'
                                element={<CreateLinkOfAppointment />}
                            />
                            <Route
                                path="/configuracion"
                                element={
                                    <SettingsAdmin />
                                }

                            />
                            <Route
                                path="*"
                                element={
                                    <div
                                        className="text-center min-h-screen w-full text-gray-400 text-sm py-2 flex justify-center items-center">
                                        404 - Página no encontrada
                                    </div>
                                }
                            />
                        </Routes>

                    </Layout>
                </main>
            ) : (
                <>
                    {location.pathname.startsWith('/user') ? (
                        <>
                            {session?.user && (
                                <UserLayout isHomePage={false} isDashboard={true}>
                                    <Routes>
                                        <Route
                                            path="/user/appointments"
                                            element={
                                                <DashboardUser />
                                            }
                                        />
                                        <Route
                                            path="/user/payment-history"
                                            element={
                                                <DashboardUserHistory />
                                            }
                                        />
                                        <Route
                                            path="/user/payment-history/:paymentId"
                                            element={
                                                <DashboardUserHistory />
                                            }
                                        />
                                        <Route path="*" element={
                                            <div className='text-center min-h-[calc(100vh-129px)] w-full text-gray-400 text-sm flex justify-center items-center'>404 - Página no encontrada</div>
                                        } />
                                    </Routes>
                                </UserLayout>
                            )}
                        </>
                    ) : (<UserLayout isHomePage={isHomePage}>
                        <Routes>
                            {session?.user && (
                                <>
                                    <Route
                                        path="/payment/pago-externo"
                                        element={
                                            <ExternalPayment selectedAppointment={selectedAppointment} />
                                        }
                                    /><Route
                                        path="/payment/stripe"
                                        element={
                                            <StripePayment selectedAppointment={selectedAppointment} selectedPlatform={selectedPlatform} />
                                        }
                                    />
                                    <Route
                                        path="/success"
                                        element={
                                            <Success />
                                        }
                                    />
                                    <Route
                                        path="/payment/paypal"
                                        element={
                                            <PaypalPayment selectedAppointment={selectedAppointment} />
                                        }
                                    />
                                    <Route
                                        path="/payment-paypal-success/:id"
                                        element={
                                            <PaypalSucces />
                                        }
                                    />
                                    <Route
                                        path="/payment-paypal-cancel/:id"
                                        element={
                                            <PaypalCancel />
                                        }
                                    />
                                    <Route
                                        path="/canceled"
                                        element={
                                            <StripeCancel />
                                        }
                                    />

                                    <Route
                                        path="selected-platform/:id"
                                        element={
                                            <SelectPlatfomOfAppointment />
                                        }
                                    />
                                </>
                            )}
                            <Route path="/" element={
                                <Home session={session} />
                            } />
                            <Route path="/pago" element={
                                <SelectMethodOfPayment session={session} selectedAppointment={selectedAppointment} />
                            } />
                            <Route path="*" element={
                                <div>404 - Página no encontrada</div>
                            } />
                        </Routes>
                    </UserLayout>
                    )}


                </>
            )}


        </div>
    );
}

export default App;

function UserLayout({ children, isHomePage, isDashboard = false }: { children: React.ReactNode, isHomePage: boolean, isDashboard?: boolean }) {
    if (isDashboard) {
        return (
            <Layout>
                {children}
            </Layout>
        )
    }
    console.log('entrando', isHomePage, isDashboard)
    return (
        <>
            <Header isHomePage={isHomePage} />
            <main className={`userlayout main ${isHomePage ? "" : "no-background"
                }`}>
                {isHomePage && (
                    <section
                        className="min-h-[821.84px] mt-[2px] text-center flex flex-col space-y-5 justify-center items-center">
                        <h1 className="text-[74px] font-[300] leading-[88.8px] text-white h-[177.89px]">
                            Firma{" "}
                            <span className="text-[#bd9554]">
                                Legal
                            </span>{" "}
                            <br />
                            Mexicana <br />
                        </h1>
                        <div className="flex items-center mt-[2px] mb-[3.75px] mx-[3.75px]">
                            <div className="bg-white mr-[12px] h-[1px] w-[52.5px]"></div>
                            <p className="font-[600] text-[15px] text-white textWithPoppins tracking-[2px]">
                                + DE 40 AÑOS DE EXPERIENCIA
                            </p>
                            <div className="bg-white ml-[12px] h-[1px] w-[52.5px]"></div>
                        </div>
                    </section>
                )}
                {children}
            </main>
        </>
    )
}
