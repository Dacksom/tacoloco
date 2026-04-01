import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    inline?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ inline = false }) => {
    if (inline) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                    <motion.div
                        className="absolute inset-0 w-20 h-20"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    >
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                stroke="#006837"
                                strokeWidth="4"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray="70 200"
                            />
                        </svg>
                    </motion.div>
                    <div className="w-20 h-20 flex items-center justify-center">
                        <img
                            src="https://tihvaojcdhcwtcoxfbyl.supabase.co/storage/v1/object/public/subd/assets/logo%20subday.png"
                            alt="Subday"
                            className="w-12 h-12 object-contain"
                        />
                    </div>
                </div>
                <p className="mt-4 text-gray-500 font-bold text-sm">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#006837] to-[#004225] flex items-center justify-center">
            <div className="relative">
                <motion.div
                    className="absolute inset-0 w-32 h-32"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="#FFCC00"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray="70 200"
                        />
                    </svg>
                </motion.div>
                <div className="w-32 h-32 flex items-center justify-center">
                    <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        src="https://tihvaojcdhcwtcoxfbyl.supabase.co/storage/v1/object/public/subd/assets/logo%20subday.png"
                        alt="Subday"
                        className="w-20 h-20 object-contain"
                    />
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
