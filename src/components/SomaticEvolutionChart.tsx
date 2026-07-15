import React from 'react';
import { AssessmentModel } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface Props {
  assessments: AssessmentModel[];
}

export default function SomaticEvolutionChart({ assessments }: Props) {
  // Sort assessments by date (oldest first for the chart)
  const sortedData = [...assessments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format data for chart
  const chartData = sortedData.map((ass) => ({
    fecha: new Date(ass.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    puntuacion: ass.score, // Score representing somatic health
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-[#FDFBF7] border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[250px] text-center">
        <Activity className="w-8 h-8 text-[#8EA393] mb-3 opacity-50" />
        <p className="text-sm text-[#2D2D2D] font-medium">Aún no hay datos para tu evolución somática.</p>
        <p className="text-xs text-[#2D2D2D]/70 mt-2 max-w-xs mx-auto">Realiza tus primeras evaluaciones para comenzar a ver tu progreso a lo largo del tiempo.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFBF7] border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm mt-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base md:text-lg font-bold text-[#2D2D2D] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#8EA393]" /> Mi Evolución Somática
          </h3>
          <p className="text-xs text-[#2D2D2D]/70 mt-1">
            Histórico de la salud de tu sistema nervioso a lo largo del tiempo.
          </p>
        </div>
        <div className="text-right">
            <span className="text-xs font-bold text-[#2D2D2D] bg-[#8EA393]/10 px-3 py-1.5 rounded-full border border-[#8EA393]/20 inline-block">
                Última puntuación: {chartData[chartData.length - 1].puntuacion}%
            </span>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8EA393" strokeOpacity={0.2} />
            <XAxis 
              dataKey="fecha" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#2D2D2D', opacity: 0.7 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#2D2D2D', opacity: 0.7 }}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#FDFBF7', borderColor: '#8EA393', borderRadius: '8px', fontSize: '12px', color: '#2D2D2D' }}
              itemStyle={{ color: '#2D2D2D', fontWeight: 'bold' }}
              labelStyle={{ color: '#2D2D2D', opacity: 0.7, marginBottom: '4px' }}
              formatter={(value: number) => [`${value}%`, 'Salud Somática']}
            />
            <Line 
              type="monotone" 
              dataKey="puntuacion" 
              name="Salud Somática"
              stroke="#8EA393" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#FDFBF7', stroke: '#8EA393', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#8EA393', stroke: '#FDFBF7', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
