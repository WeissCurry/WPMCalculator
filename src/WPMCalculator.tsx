import React, { useState, useEffect } from 'react';

interface AlternativeData {
    [key: string]: number[];
}

interface WPMResult {
    [key: string]: number;
}

// Fungsi perhitungan Weighted Product Method (WPM)
function hitungWPM(
    alternatifData: AlternativeData,
    bobotPersen: number[], // Bobot diterima dalam persen
    isCriteriaBenefit: boolean[],
    alternatifNames: string[] // Menerima nama alternatif yang sudah di-rename
): WPMResult {
    // Konversi bobot dari persen ke desimal
    const bobotDesimal = bobotPersen.map(b => b / 100);

    // Validasi total bobot dalam persen
    const totalBobotAsli = bobotPersen.reduce((sum, current) => sum + current, 0);
    if (Math.abs(totalBobotAsli - 100) > 1e-9) { // Toleransi untuk total 100%
        throw new Error("Jumlah bobot kriteria harus sama dengan 100%.");
    }

    const skorWPM: WPMResult = {};
    const numCriteria = bobotDesimal.length;

    if (alternatifNames.length === 0 || numCriteria === 0) {
        return {};
    }

    // --- Langkah 1: Normalisasi Matriks Keputusan ---
    // WPM tidak memerlukan normalisasi seperti WSM/WASPAS karena perhitungannya berbasis perkalian.
    // Namun, nilai kriteria masih perlu diproses untuk benefit/cost.
    const minValues = Array(numCriteria).fill(Infinity);
    const maxValues = Array(numCriteria).fill(-Infinity);

    alternatifNames.forEach(name => {
        const values = alternatifData[name];
        values.forEach((value, j) => {
            if (value <= 0) {
                throw new Error(`Nilai kriteria tidak boleh nol atau negatif. Alternatif: ${name}, Kriteria ke-${j + 1}.`);
            }
            minValues[j] = Math.min(minValues[j], value);
            maxValues[j] = Math.max(maxValues[j], value);
        });
    });

    // --- Langkah 2: Hitung WPM untuk Setiap Alternatif ---
    for (let i = 0; i < alternatifNames.length; i++) {
        const namaAlternatif = alternatifNames[i];
        const values = alternatifData[namaAlternatif]; // Mengambil nilai asli alternatif

        let wpmScore = 1;

        for (let j = 0; j < numCriteria; j++) {
            let processedValue: number;
            if (isCriteriaBenefit[j]) { // Benefit
                processedValue = values[j];
            } else { 
                processedValue = minValues[j] / values[j];
            }
            wpmScore *= Math.pow(processedValue, bobotDesimal[j]);
        }
        skorWPM[namaAlternatif] = wpmScore;
    }
    return skorWPM;
}

const WPMCalculator: React.FC = () => {
    const [numAlternatives, setNumAlternatives] = useState<number>(3);
    const [numCriteria, setNumCriteria] = useState<number>(4);

    // State untuk nama alternatif
    const [alternatifNames, setAlternatifNames] = useState<string[]>(
        Array.from({ length: 3 }, (_, i) => `Alternatif ${i + 1}`)
    );
    // State untuk nama kriteria
    const [criteriaNames, setCriteriaNames] = useState<string[]>(
        Array.from({ length: 4 }, (_, i) => `Kriteria ${i + 1}`)
    );

    const [alternatifValues, setAlternatifValues] = useState<number[][]>(
        Array.from({ length: numAlternatives }, () => Array(numCriteria).fill(0))
    );

    const [bobotCriteria, setBobotCriteria] = useState<number[]>(
        Array(numCriteria).fill(25)
    );

    const [isCriteriaBenefit, setIsCriteriaBenefit] = useState<boolean[]>(
        Array(numCriteria).fill(true)
    );

    const [wpmResults, setWpmResults] = useState<WPMResult | null>(null);
    const [bestAlternative, setBestAlternative] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Efek samping untuk menyesuaikan ukuran array saat numAlternatives/numCriteria berubah
    useEffect(() => {
        // Sesuaikan nama alternatif
        setAlternatifNames(prev => {
            const newNames = Array.from({ length: numAlternatives }, (_, altIndex) => {
                return prev[altIndex] || `Alternatif ${altIndex + 1}`;
            });
            return newNames;
        });

        // Sesuaikan nama kriteria
        setCriteriaNames(prev => {
            const newNames = Array.from({ length: numCriteria }, (_, critIndex) => {
                return prev[critIndex] || `Kriteria ${critIndex + 1}`;
            });
            return newNames;
        });

        // Sesuaikan alternatifValues
        setAlternatifValues(prev => {
            const newValues = Array.from({ length: numAlternatives }, (_, altIndex) => {
                return Array.from({ length: numCriteria }, (_, critIndex) => {
                    return prev[altIndex]?.[critIndex] || 0;
                });
            });
            return newValues;
        });

        // Sesuaikan bobotCriteria
        setBobotCriteria(prev => {
            const newBobot = Array.from({ length: numCriteria }, (_, index) => {
                return prev[index] || 0;
            });
            return newBobot;
        });

        // Sesuaikan isCriteriaBenefit
        setIsCriteriaBenefit(prev => {
            const newTypes = Array.from({ length: numCriteria }, (_, index) => {
                return prev[index] === undefined ? true : prev[index];
            });
            return newTypes;
        });

    }, [numAlternatives, numCriteria]);

    // Handlers untuk mengubah nama
    const handleAlternativeNameChange = (index: number, name: string) => {
        setAlternatifNames(prev => {
            const newNames = [...prev];
            newNames[index] = name;
            return newNames;
        });
    };

    const handleCriteriaNameChange = (index: number, name: string) => {
        setCriteriaNames(prev => {
            const newNames = [...prev];
            newNames[index] = name;
            return newNames;
        });
    };

    const handleAlternativeValueChange = (altIndex: number, critIndex: number, value: string) => {
        const newValue = parseFloat(value);
        setAlternatifValues(prev => {
            const newValues = [...prev];
            newValues[altIndex][critIndex] = isNaN(newValue) ? 0 : newValue;
            return newValues;
        });
    };

    const handleBobotChange = (index: number, value: string) => {
        const newValue = parseFloat(value);
        setBobotCriteria(prev => {
            const newBobot = [...prev];
            newBobot[index] = isNaN(newValue) ? 0 : newValue;
            return newBobot;
        });
    };

    const handleCriteriaTypeChange = (index: number, type: 'benefit' | 'cost') => {
        setIsCriteriaBenefit(prev => {
            const newTypes = [...prev];
            newTypes[index] = type === 'benefit';
            return newTypes;
        });
    };

    const handleCalculateWPM = () => {
        setError(null);
        setWpmResults(null);
        setBestAlternative(null);

        try {
            const formattedAlternatifData: AlternativeData = {};
            for (let i = 0; i < numAlternatives; i++) {
                // Menggunakan nama alternatif dari state
                formattedAlternatifData[alternatifNames[i]] = alternatifValues[i];
            }

            const results = hitungWPM(
                formattedAlternatifData,
                bobotCriteria, // Dikirim dalam persen
                isCriteriaBenefit,
                alternatifNames // Mengirim nama alternatif ke fungsi perhitungan
            );
            setWpmResults(results);

            let highestScore = -1;
            let bestAltName: string | null = null;
            for (const altName in results) {
                if (results.hasOwnProperty(altName)) {
                    if (results[altName] > highestScore) {
                        highestScore = results[altName];
                        bestAltName = altName;
                    }
                }
            }
            setBestAlternative(bestAltName);

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="container mx-auto p-8 bg-gray-900 rounded-xl shadow-lg max-w-5xl my-10 text-gray-100">

            <h1 className="text-2xl lg:text-4xl font-extrabold text-center mb-8">
                Kalkulator WPM <br /> <i className="text-sm lg:text-3xl fa-italic font-normal">Weighted Product Method</i>
            </h1>
            <hr className="my-8 border-gray-700" />

            {/* Input Jumlah Alternatif & Kriteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label htmlFor="numAlternatives" className="block text-sm font-semibold text-gray-300 mb-2">
                        Jumlah Alternatif:
                    </label>
                    <input
                        type="number"
                        id="numAlternatives"
                        value={numAlternatives}
                        onChange={(e) => setNumAlternatives(Math.max(1, Number(e.target.value) || 1))}
                        min="1"
                        className="w-full p-3 border border-gray-600 rounded-lg shadow-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    />
                </div>
                <div>
                    <label htmlFor="numCriteria" className="block text-sm font-semibold text-gray-300 mb-2">
                        Jumlah Kriteria:
                    </label>
                    <input
                        type="number"
                        id="numCriteria"
                        value={numCriteria}
                        onChange={(e) => setNumCriteria(Math.max(1, Number(e.target.value) || 1))}
                        min="1"
                        className="w-full p-3 border border-gray-600 rounded-lg shadow-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    />
                </div>
            </div>

            <hr className="my-8 border-gray-700" />

            {/* Rename Kriteria & Bobot Kriteria & Tipe Kriteria */}
            <h2 className="text-2xl font-semibold mb-6 text-gray-300">Pengaturan Kriteria</h2>
            <div className="gridCriteria grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: numCriteria }).map((_, critIndex) => (
                    <div key={`crit-settings-${critIndex}`} className="p-4 border border-gray-700 rounded-lg bg-gray-800 shadow-sm">
                        <label htmlFor={`crit-name-${critIndex}`} className="block text-sm font-medium text-gray-300 mb-2">
                            Nama Kriteria {critIndex + 1}:
                        </label>
                        <input
                            type="text"
                            id={`crit-name-${critIndex}`}
                            value={criteriaNames[critIndex]}
                            onChange={(e) => handleCriteriaNameChange(critIndex, e.target.value)}
                            className="w-full p-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition mb-3"
                        />

                        <label htmlFor={`bobot-${critIndex}%`} className="block text-sm font-medium text-gray-300 mb-2">
                            Bobot ({criteriaNames[critIndex]}) dalam %:
                        </label>
                        <input
                            type="number"
                            id={`bobot-${critIndex}`}
                            value={bobotCriteria[critIndex]}
                            onChange={(e) => handleBobotChange(critIndex, e.target.value)}
                            step="1"
                            min="0"
                            max="100"
                            placeholder="Ex: 25 untuk 25%"
                            className="w-full p-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition mb-3"
                        />
                        <div className="flex justify-around mt-2">
                            <label className="inline-flex items-center text-gray-300">
                                <input
                                    type="radio"
                                    name={`crit-type-${critIndex}`}
                                    value="benefit"
                                    checked={isCriteriaBenefit[critIndex]}
                                    onChange={() => handleCriteriaTypeChange(critIndex, 'benefit')}
                                    className="form-radio h-4 w-4 text-blue-500 bg-gray-600 border-gray-500"
                                />
                                <span className="ml-2 text-sm">Benefit</span>
                            </label>
                            <label className="inline-flex items-center text-gray-300">
                                <input
                                    type="radio"
                                    name={`crit-type-${critIndex}`}
                                    value="cost"
                                    checked={!isCriteriaBenefit[critIndex]}
                                    onChange={() => handleCriteriaTypeChange(critIndex, 'cost')}
                                    className="form-radio h-4 w-4 text-red-500 bg-gray-600 border-gray-500"
                                />
                                <span className="ml-2 text-sm">Cost</span>
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            <hr className="my-8 border-gray-700" />

            {/* Input Nilai Kriteria untuk Setiap Alternatif */}
            <h2 className="text-2xl font-semibold mb-6 text-gray-300">Nilai Kriteria untuk Setiap Alternatif</h2>
            <div className="space-y-8 mb-8">
                {Array.from({ length: numAlternatives }).map((_, altIndex) => (
                    <div
                        key={`alternatif-${altIndex}`}
                        className="p-6 border border-gray-700 rounded-xl bg-gray-800 shadow-sm"
                    >
                        {/* Rename Alternatif */}
                        <div className="mb-4">
                            <label htmlFor={`alt-name-${altIndex}`} className="block text-lg font-semibold text-gray-100 mb-2">
                                Nama Alternatif {altIndex + 1}:
                            </label>
                            <input
                                type="text"
                                id={`alt-name-${altIndex}`}
                                value={alternatifNames[altIndex]}
                                onChange={(e) => handleAlternativeNameChange(altIndex, e.target.value)}
                                className="w-full p-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                            />
                        </div>

                        <h3 className="font-semibold text-xl mb-4 text-gray-100">Nilai untuk "{alternatifNames[altIndex]}"</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {Array.from({ length: numCriteria }).map((_, critIndex) => (
                                <div key={`alt-${altIndex}-crit-${critIndex}`}>
                                    <label
                                        htmlFor={`alt-${altIndex}-crit-${critIndex}`}
                                        className="block text-xs font-medium text-gray-400 mb-2"
                                    >
                                        {criteriaNames[critIndex]}
                                    </label>
                                    <input
                                        type="number"
                                        id={`alt-${altIndex}-crit-${critIndex}`}
                                        value={alternatifValues[altIndex]?.[critIndex] || ''}
                                        onChange={(e) =>
                                            handleAlternativeValueChange(altIndex, critIndex, e.target.value)
                                        }
                                        className="w-full p-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tombol Hitung */}
            <button
                onClick={handleCalculateWPM}
                className="w-full py-4 px-6 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 transition duration-300"
            >
                Hitung WPM
            </button>

            {/* Tampilan Error */}
            {error && (
                <div className="mt-6 p-4 bg-red-900 text-red-400 border border-red-700 rounded-lg shadow-sm">
                    <p className="font-semibold mb-1">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Tampilan Hasil */}
            {wpmResults && !error && (
                <div className="mt-10">
                    <h2 className="text-3xl font-bold mb-6 text-gray-100">Hasil Perhitungan WPM:</h2>
                    <ul className="space-y-3 mb-6">
                        {Object.entries(wpmResults).map(([altName, score]) => (
                            <li
                                key={altName}
                                className="p-3 bg-gray-800 border border-gray-700 rounded-lg flex justify-between items-center shadow-sm"
                            >
                                <span className="font-semibold text-gray-300">{altName}:</span>
                                <span className="text-blue-400 font-extrabold text-lg">{score.toFixed(6)}</span>
                            </li>
                        ))}
                    </ul>
                    {bestAlternative && (
                        <div className="p-6 bg-green-900 text-green-400 border border-green-700 rounded-xl text-center shadow-md">
                            <p className="text-2xl font-extrabold">Alternatif Terbaik:</p>
                            <p className="text-4xl font-black mt-3">
                                {bestAlternative} (Skor: {wpmResults[bestAlternative].toFixed(6)})
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WPMCalculator;