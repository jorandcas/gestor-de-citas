import {Video, Link as LinkIcon, CalendarDays, Clock} from "lucide-react";
import {useSettings} from "@/hooks/useSettings.tsx";
import {useLinkAppointment} from "@/hooks/useLinkAppointment.tsx";
import {motion} from "motion/react";
import Modal from "@/components/Modal.tsx";

export const CreateLinkOfAppointment = () => {
    const {allMeetingPlatforms} = useSettings();
    const {allAppointments, generateLinkWithMeet, generateLinkWithZoom, urlMeet,setUrlMeet,setShowModal,showModal,saveLink,setIdOfAppointment,loading} = useLinkAppointment();
    return (
        <div className="container mx-auto px-4 py-6">
            {
                showModal && (
                    <Modal setShowModal={setShowModal} title={'Editar Link'}>
                        <form className='w-full'>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
                                       htmlFor="meetingLink">
                                    Link de la reunión
                                </label>
                                <input
                                    type="url"
                                    id="meetingLink"
                                    name="meetingLink"
                                    value={urlMeet ?? ''}
                                    onChange={(e) => {
                                        setUrlMeet(e.target.value);
                                    }}
                                    placeholder="https://example.com/meeting-link"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:text-gray-200"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                                        onClick={() => generateLinkWithMeet()}
                                        disabled={loading}
                                    >
                                        Generar con Meet
                                    </button>
                                    <button
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                                        onClick={() => generateLinkWithZoom()}
                                        disabled={loading}
                                    >
                                        Generar con Zoom
                                    </button>
                                </div>
                                <button
                                    onClick={(e)=> saveLink(e)}
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300"
                                >
                                    Guardar Link
                                </button>
                            </div>
                        </form>
                    </Modal>
                )
            }
            <motion.div
                initial={{y: -100, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                className="max-w-7xl w-full mx-auto rounded-lg flex flex-col items-center"
            >
                <div className="max-md:flex-col max-md:items-start mb-6 flex items-center justify-between w-full">
                    <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Video className="text-blue-500 w-8 h-8"/> Agrega el link de la cita
                    </h2>
                    <hr/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                    {!allAppointments ? (
                        <div>Cargando citas...</div>
                    ) : allAppointments.length === 0 ? (
                        <div>No hay citas disponibles.</div>
                    ) : (
                        allAppointments
                            .filter((app) => app.status === "reservado")
                            .map((app) => {
                                const platform = allMeetingPlatforms?.MeetingPlatforms.find(
                                    (platform) => platform.id === app?.meetingPlatformId
                                );
                                const date = new Date(app.day).toLocaleDateString();
                                const start = app.start_time;
                                const end = app.end_time;
                                return (
                                    <div
                                        className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col gap-4 w-full max-w-md border border-gray-200 dark:border-gray-700"
                                        key={app.id}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                                                <Video className="text-blue-500 w-6 h-6"/>
                                            </span>
                                            <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                                {platform?.name ?? "Desconocida"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <CalendarDays className="w-5 h-5 text-gray-400"/>
                                            <span className="font-medium">{date}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Clock className="w-5 h-5 text-gray-400"/>
                                            <span className="font-medium">{start} - {end}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <LinkIcon className="text-green-500 w-5 h-5"/>
                                            {app.meeting_link ? (
                                                <a
                                                    href={app.meeting_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 underline break-all"
                                                >
                                                    {app.meeting_link}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">Aún no hay link</span>
                                            )}
                                        </div>
                                        <button
                                            className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mt-4 transition-colors duration-300'
                                            onClick={() => (
                                            setShowModal(true),
                                            setIdOfAppointment(app.id))}
                                        >
                                            Editar Link
                                        </button>
                                    </div>
                                );
                            })
                    )}
                </div>
            </motion.div>
        </div>
    );
};
