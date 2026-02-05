import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
	SignedIn,
	SignedOut,
	SignInButton,
	UserButton,
	useSession,
} from "@clerk/clerk-react";
import LogoHeaderIcon from "../../assets/logo-abm2@4x.png";
import "./styles.css";
import LogoHeaderWhiteIcon from "../../assets/backgroud-white.png";
import { useLocation } from "react-router-dom";
import MessagesIcon from "../icons/messages";
import GpsIcon from "../icons/gps";
import FacebookIcon from "../icons/facebook";
import InstagramIcon from "../icons/instagram";
import { twMerge } from "tailwind-merge";


const navLinks = [
	{ name: "INICIO", href: "https://becerramanchinelly.com/" },
	{ name: "NOSOTROS", href: "https://becerramanchinelly.com/mision/" },
	{ name: "SERVICIOS", href: "https://becerramanchinelly.com/mision/services/" },
	{ name: "AREA LEGAL", href: "https://becerramanchinelly.com/materias/" },
	{ name: "CONTACTO", href: "https://becerramanchinelly.com/mision/contacto/" },
];

export const Header = ({ isHomePage }: { isHomePage: boolean }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const [scrollY, setScrollY] = useState(0);

	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
	const location = useLocation();
	const { session } = useSession();
	const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

	const parallaxSpeed = 0.2;

	// Función para manejar el evento de scroll
	const handleScroll = useCallback(() => {
		const currentScrollY = window.pageYOffset;
		setScrollY(currentScrollY);
		setScrolled(currentScrollY > 10);
	}, []);

	useEffect(() => {
		// Agrega el event listener al montar el componente
		window.addEventListener('scroll', handleScroll);

		// Remueve el event listener al desmontar el componente para evitar fugas de memoria
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, [handleScroll]);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768);
			if (window.innerWidth >= 768) {
				setIsOpen(false);
			}
		};

		const handleScroll = () => {
			setScrolled(window.scrollY > 10);
		};

		window.addEventListener("resize", handleResize);
		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	// const toggleMenu = () => {
	//     setIsOpen(!isOpen);
	// };

	const menuVariants: Variants = {
		open: {
			opacity: 1,
			x: 0,
			transition: {
				type: "spring",
				stiffness: 300,
				damping: 30,
			},
		},
		closed: {
			opacity: 0,
			x: 100,
			transition: {
				type: "spring",
				stiffness: 300,
				damping: 30,
			},
		},
	};
	return (
		<>
			<header
				className={twMerge(`header fixed top-0 flex flex-col justify-center items-center ${(scrolled) ? "scrolled" : ""} mx-auto`, scrolled || location.pathname !== '/' ? "scrolled" : "")}
			>
				{!(scrolled || location.pathname !== '/') && (
					<div className="w-full flex flex-row items-center justify-center h-[32px]" style={{ backgroundColor: 'rgba(30, 30, 30, 0.8)' }}>
						<div className="max-w-[1200px] w-full flex flex-row items-center justify-between">
							<div className="flex flex-row items-center space-x-2">
								<MessagesIcon className="text-primary" size={13} />
								<span className="text-[12.8px] opacity-80 leading-[32px] pt-serif-regular">christian@becerramanchinelly.com</span></div>
							<div className="flex flex-row items-center space-x-2 ml-[25.6px]">
								<GpsIcon className="text-primary" size={11} />
								<span className="text-[12.8px] opacity-80 leading-[32px] pt-serif-regular">Boulevard Atlixco 73, Interior 1 San José Vista Hermosa, Puebla, Puebla 72190</span>
							</div>
							<div className="flex flex-row items-center space-x-2 ml-auto">
								<span className="text-[12.8px] opacity-80 leading-[32px] pt-serif-regular">Síguenos:</span>
								<FacebookIcon className="text-primary" size={12} />
								<InstagramIcon className="text-primary" size={13} />
							</div>
						</div>
					</div>
				)}
				<div className="flex flex-row justify-start items-center w-full max-w-[1200px] mx-auto">
					<div>
						{(scrolled || location.pathname !== '/') ? (
							<img
								src={LogoHeaderIcon}
								alt="logo"
								className="w-[137.38px] h-[56px]"
							/>
						) : (
							<img
								src={LogoHeaderWhiteIcon}
								alt="logo"
								className="w-[177.55px] h-[70.55px]"
							/>
						)}
					</div>
					<ul className="flex flex-row items-center max-h-[70px] max-w-[667px] ml-[190px]">
						{navLinks.map((link, index) => (
							<li className="pr-[50px]" key={index}>
								<a
									href={link.href}
									className="nav-link pb-3 text-nowrap"
								>
									{link.name}
								</a>
							</li>
						))}
						{session?.user &&
							session?.publicUserData?.identifier ===
							adminEmail && (
								<a
									href="/pagos"
									className="nav-link mx-6">PAGOS</a>
							)}
					</ul>
					<button className="header-number btn-style505 border border-[#bd9554] ml-auto">
						<span className="text-[#bd9554]">+</span>
						522222480015
					</button>
					{/* <div className="auth-buttons">
					<SignedOut>
						<SignInButton mode="modal">
							<button className="sign-in-button">
								Iniciar Sesión
							</button>
						</SignInButton>
					</SignedOut>
					<SignedIn>
						<UserButton afterSignOutUrl="/" />
					</SignedIn>
				</div> */}
				</div>

				<AnimatePresence>
					{isOpen && isMobile && (
						<motion.div
							className="mobile-menu"
							initial="closed"
							animate="open"
							exit="closed"
							variants={menuVariants}
						>
							<nav className="mobile-nav">
								<ul>
									{navLinks.map((link) => (
										<motion.li
											key={link.name}
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
										>
											<a
												href={link.href}
												className="mobile-nav-link"
												onClick={() =>
													setIsOpen(false)
												}
											>
												{link.name}
											</a>
										</motion.li>
									))}
									<li className="auth-buttons-mobile">
										<SignedOut>
											<SignInButton mode="modal">
												<button className="sign-in-button">
													Iniciar Sesión
												</button>
											</SignInButton>
										</SignedOut>
										<SignedIn>
											<UserButton afterSignOutUrl="/" />
										</SignedIn>
									</li>
								</ul>
							</nav>
						</motion.div>
					)}
				</AnimatePresence>
			</header>
			{isHomePage && (
				<div className='home-background' style={{
					transform: `translateY(${scrollY * parallaxSpeed}px)`,
				}}></div>
			)}
		</>
	);
};

export default Header;
