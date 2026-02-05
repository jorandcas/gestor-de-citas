import {useSettings} from "@/hooks/useSettings.tsx";
import {useSelectPlatform} from "@/hooks/useSelectPlatform.tsx";
import { Video } from "lucide-react";

export const SelectPlatfomOfAppointment = () => {
    const {allMeetingPlatforms}=useSettings()
    const {handleSubmitPlatform}=useSelectPlatform()
    return (
		<div className="flex flex-col items-center justify-center min-h-screen">
			{!allMeetingPlatforms ? (
				<div>Cargando plataformas de reunión...</div>
			) : allMeetingPlatforms.MeetingPlatforms.length === 0 ? (
				<div className="text-black">No hay plataformas de reunión disponibles.</div>
			) : (
				<div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-xl">
					<h1 className="text-4xl font-bold mb-6 text-center text-[#bd9554]">
						Selecciona una plataforma de reunión
					</h1>
					<p className="text-gray-500">
						Estimado usuario, por favor elija una de las
						siguientes plataformas de reunión para su
						cita:
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
						{allMeetingPlatforms.MeetingPlatforms.filter(
							(met) => met.is_active === true
						).map((platform) => (
							<button
								key={platform.id}
								className="border border-[#bd9554] p-4 rounded hover:shadow-md hover:scale-105 cursor-pointer"
								value={platform.id}
								onClick={(e) =>
									handleSubmitPlatform(
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
										<p className="text-gray-600">
											{platform.description}
										</p>
									</div>
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
