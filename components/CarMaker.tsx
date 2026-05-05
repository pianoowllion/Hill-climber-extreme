
import React, { useState } from 'react';
import { CarModel } from '../types';
import { GAME_CONFIG } from '../constants';

interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}

const RangeControl: React.FC<RangeControlProps> = ({ label, value, min, max, step, onChange }) => {
  return (
    <div>
      <div className="flex justify-between text-xs font-bold uppercase tracking-wide mb-2 text-neutral-400">
        <label>{label}</label>
        <span className="font-mono text-amber-500">{value.toFixed(3)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
      />
    </div>
  );
};

interface CarMakerProps {
  onClose: () => void;
  onSave: (car: CarModel) => void;
}

export default function CarMaker({ onClose, onSave }: CarMakerProps) {
  // Local state for the custom car being built
  const [car, setCar] = useState<CarModel>({
    id: 'custom-' + Date.now(),
    name: 'Custom Rider',
    color: '#ef4444',
    bodyColor: '#ef4444',
    texture: 'plain',
    textureColor2: '#b91c1c',
    wheelColor: '#1f2937',
    speed: 1.0,
    acceleration: 0.02,
    density: 0.004,
    friction: 1.0,
    driveTrain: 'RWD',
    shape: 'coupe',
    width: GAME_CONFIG.CAR_WIDTH,
    height: GAME_CONFIG.CAR_HEIGHT,
    wheelSize: GAME_CONFIG.WHEEL_SIZE,
    imageScale: 1.0,
    imageYOffset: 0
  });

  const handleChange = (key: keyof CarModel, value: any) => {
    setCar(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCar(prev => ({
            ...prev,
            imageUrl: ev.target!.result as string,
            texture: 'plain', // Reset texture mode to avoid conflicts
            imageScale: 1.5, // Default nice scale
            imageYOffset: -10
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setCar(prev => ({ ...prev, imageUrl: undefined }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(car, null, 2));
    alert("Car JSON copied to clipboard!");
  };

  const handleRandomize = () => {
    const textures = ['plain', 'striped', 'dots', 'checker', 'gradient'];
    const driveTrains = ['RWD', 'FWD', 'AWD'];
    const shapes = ['coupe', 'buggy', 'jeep', 'racer', 'van', 'supercar', 'bike'];
    const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

    setCar(prev => ({
      ...prev,
      bodyColor: randomColor(),
      textureColor2: randomColor(),
      wheelColor: '#171717', 
      texture: textures[Math.floor(Math.random() * textures.length)] as any,
      driveTrain: driveTrains[Math.floor(Math.random() * driveTrains.length)] as any,
      shape: shapes[Math.floor(Math.random() * shapes.length)] as any,
      width: 100 + Math.random() * 100,
      height: 40 + Math.random() * 60,
      wheelSize: 20 + Math.random() * 30,
      imageUrl: undefined // clear image on random
    }));
  };

  const handleSaveToGarage = () => {
      // Refresh ID to ensure uniqueness on save time
      const finalCar = { ...car, id: `custom-${Date.now()}` };
      onSave(finalCar);
  };

  // Calculations for preview to match Game.tsx physics
  const previewWheelSize = car.wheelSize || GAME_CONFIG.WHEEL_SIZE;
  const previewCarWidth = car.width || GAME_CONFIG.CAR_WIDTH;
  const wheelX = previewCarWidth / 2.2 - previewWheelSize;
  const wheelY = 20; // Fixed baseline for preview

  return (
    <div className="absolute inset-0 z-50 bg-neutral-900 text-white flex flex-col">
       <div className="p-6 border-b border-neutral-800 bg-neutral-900 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Car Builder</h2>
                <p className="text-xs text-neutral-500 uppercase tracking-widest">Engineering Bay</p>
            </div>
        <div className="flex gap-4">
          <button onClick={handleRandomize} className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm font-bold hover:bg-neutral-700 transition-colors">🎲 Random</button>
          <button onClick={handleCopy} className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm font-bold hover:bg-neutral-700 transition-colors">Copy JSON</button>
          
          <button onClick={handleSaveToGarage} className="px-6 py-2 bg-emerald-600 border border-emerald-500 rounded text-sm font-bold hover:bg-emerald-500 transition-colors flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20">
             <span>💾</span> Save to Garage
          </button>
          
          <button onClick={onClose} className="px-4 py-2 bg-neutral-700 rounded text-sm font-bold hover:bg-neutral-600 transition-colors">Exit</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Controls */}
        <div className="w-96 bg-neutral-900 p-6 overflow-y-auto border-r border-neutral-800 space-y-8 custom-scrollbar">

          {/* Text Inputs */}
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Vehicle Name</label>
            <input
              type="text"
              value={car.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Custom Image Upload */}
          <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">Custom Chassis <span className="text-[10px] bg-neutral-700 px-1 rounded text-neutral-400">PNG</span></h3>
            {!car.imageUrl ? (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-black hover:file:bg-amber-500 cursor-pointer w-full"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-green-900/20 p-2 rounded border border-green-900/30">
                  <span className="text-xs text-green-400 font-bold">Image Active</span>
                  <button onClick={handleClearImage} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider">Remove</button>
                </div>
                <RangeControl label="Scale" value={car.imageScale || 1.0} min={0.5} max={3.0} step={0.1} onChange={(v) => handleChange('imageScale', v)} />
                <RangeControl label="Y-Offset" value={car.imageYOffset || 0} min={-100} max={100} step={1} onChange={(v) => handleChange('imageYOffset', v)} />
              </div>
            )}
          </div>

          {/* Dimensions */}
          <div className="space-y-6 border-b border-neutral-800 pb-6">
               <h3 className="text-sm font-bold text-white border-l-2 border-amber-500 pl-2">Dimensions</h3>
               <RangeControl label="Chassis Width" value={car.width || GAME_CONFIG.CAR_WIDTH} min={80} max={250} step={5} onChange={(v) => handleChange('width', v)} />
               <RangeControl label="Chassis Height" value={car.height || GAME_CONFIG.CAR_HEIGHT} min={30} max={120} step={5} onChange={(v) => handleChange('height', v)} />
               <RangeControl label="Wheel Radius" value={car.wheelSize || GAME_CONFIG.WHEEL_SIZE} min={15} max={50} step={1} onChange={(v) => handleChange('wheelSize', v)} />
          </div>

          {/* Colors - Only show if no image */}
          {!car.imageUrl && (
            <div className="space-y-6 border-b border-neutral-800 pb-6">
              <h3 className="text-sm font-bold text-white border-l-2 border-amber-500 pl-2">Aesthetics</h3>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Chassis Shape</label>
                <select
                  value={car.shape || 'coupe'}
                  onChange={(e) => handleChange('shape', e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="coupe">Coupe</option>
                  <option value="buggy">Buggy</option>
                  <option value="jeep">Jeep</option>
                  <option value="racer">Racer</option>
                  <option value="van">Van</option>
                  <option value="supercar">Supercar</option>
                  <option value="bike">Motorcycle</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-400 uppercase">Primary Color</label>
                <input type="color" value={car.bodyColor} onChange={(e) => handleChange('bodyColor', e.target.value)} className="bg-transparent border-0 w-8 h-8 cursor-pointer" />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Texture Pattern</label>
                <select
                  value={car.texture}
                  onChange={(e) => handleChange('texture', e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="plain">Solid</option>
                  <option value="striped">Racing Stripes</option>
                  <option value="dots">Polka Dots</option>
                  <option value="checker">Checkered Flag</option>
                  <option value="gradient">Linear Gradient</option>
                </select>
              </div>
              {car.texture !== 'plain' && (
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Secondary Color</label>
                  <input type="color" value={car.textureColor2} onChange={(e) => handleChange('textureColor2', e.target.value)} className="bg-transparent border-0 w-8 h-8 cursor-pointer" />
                </div>
              )}
            </div>
          )}

          {/* Always show wheel color */}
          <div className="flex items-center justify-between pb-6 border-b border-neutral-800">
            <label className="text-xs font-bold text-neutral-400 uppercase">Wheel Rim Color</label>
            <input type="color" value={car.wheelColor} onChange={(e) => handleChange('wheelColor', e.target.value)} className="bg-transparent border-0 w-8 h-8 cursor-pointer" />
          </div>

          {/* Physics */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white border-l-2 border-amber-500 pl-2">Performance Specs</h3>

            <RangeControl label="Top Speed" value={car.speed} min={0.5} max={2.0} step={0.1} onChange={(v) => handleChange('speed', v)} />
            <RangeControl label="Torque (Accel)" value={car.acceleration} min={0.01} max={0.05} step={0.001} onChange={(v) => handleChange('acceleration', v)} />
            <RangeControl label="Weight" value={car.density} min={0.001} max={0.01} step={0.0005} onChange={(v) => handleChange('density', v)} />
            <RangeControl label="Tire Grip" value={car.friction} min={0.1} max={2.0} step={0.1} onChange={(v) => handleChange('friction', v)} />

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Drivetrain</label>
              <select
                value={car.driveTrain}
                onChange={(e) => handleChange('driveTrain', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="RWD">RWD (Rear Wheel Drive)</option>
                <option value="FWD">FWD (Front Wheel Drive)</option>
                <option value="AWD">AWD (All Wheel Drive)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 p-10 flex flex-col items-center justify-center bg-black relative">
          <div className="absolute top-6 left-6 text-neutral-600 font-mono text-xs uppercase tracking-widest">Blueprint View</div>

          <div className="scale-150 p-12 bg-neutral-800 rounded-full shadow-2xl flex items-center justify-center border-4 border-neutral-700 relative overflow-hidden ring-1 ring-white/10" style={{ width: 450, height: 450 }}>
            {/* Fake Ground */}
            <div className="absolute bottom-0 w-full h-1/3 bg-neutral-900 border-t-4 border-emerald-500/50"></div>

            {/* Car Rendering */}
            <svg width="200" height="100" viewBox="-100 -50 200 100" className="z-10 drop-shadow-2xl">
              <defs>
                {car.texture === 'striped' && (
                  <pattern id="maker-preview-pattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                    <rect width="20" height="20" fill={car.bodyColor} />
                    <rect width="10" height="20" fill={car.textureColor2} />
                  </pattern>
                )}
                {car.texture === 'dots' && (
                  <pattern id="maker-preview-pattern" patternUnits="userSpaceOnUse" width="10" height="10">
                    <rect width="10" height="10" fill={car.bodyColor} />
                    <circle cx="5" cy="5" r="2" fill={car.textureColor2} />
                  </pattern>
                )}
                {car.texture === 'checker' && (
                  <pattern id="maker-preview-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
                    <rect width="20" height="20" fill={car.bodyColor} />
                    <rect x="0" y="0" width="10" height="10" fill={car.textureColor2} />
                    <rect x="10" y="10" width="10" height="10" fill={car.textureColor2} />
                  </pattern>
                )}
                {car.texture === 'gradient' && (
                  <linearGradient id="maker-preview-pattern" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={car.textureColor2} />
                    <stop offset="100%" stopColor={car.bodyColor} />
                  </linearGradient>
                )}
              </defs>
              <g transform="translate(0, 0)">

                {/* BODY: IMAGE or SVG */}
                {car.imageUrl ? (
                  <image
                    href={car.imageUrl}
                    x={-100 * (car.imageScale || 1)}
                    y={-50 + (car.imageYOffset || 0) - (50 * ((car.imageScale || 1) - 1))}
                    width={200 * (car.imageScale || 1)}
                    height={100 * (car.imageScale || 1)}
                    preserveAspectRatio="xMidYMid meet"
                  />
                ) : (
                  <g>
                    {/* Consistent paths with CarSelection and Game */}
                    <path
                        d={
                            (car.shape === 'coupe' || !car.shape) ? "M -80 25 L -80 -10 Q -80 -45 -32 -45 L 8 -45 Q 64 -35 88 0 L 96 25 L -80 25 Z" :
                            car.shape === 'jeep' ? "M -72 25 L -72 -25 L -40 -25 L -40 -80 L 48 -80 L 48 -10 L 88 -10 L 88 25 L -72 25 Z" :
                            car.shape === 'van' ? "M -72 25 L -72 -65 L 56 -65 Q 88 -60 88 -10 L 88 25 L -72 25 Z" :
                            car.shape === 'supercar' ? "M -88 25 L -88 0 L -40 -30 L 8 -30 Q 80 -20 112 0 L 116 25 L -88 25 Z" :
                            car.shape === 'racer' ? "M -96 10 L -96 -15 L -40 -25 L 24 -25 Q 80 -15 120 0 L 120 15 L -96 10 Z" :
                            car.shape === 'buggy' ? "M -56 0 L -40 -70 L 32 -70 L 72 0 L 88 0 L 72 25 L -72 25 L -56 0 Z" :
                            "M -80 15 L -80 -10 L 80 -10 L 80 15 Z"
                        }
                        fill={car.texture !== 'plain' ? "url(#maker-preview-pattern)" : car.bodyColor}
                        stroke="rgba(0,0,0,0.5)" strokeWidth="2"
                    />

                    {(car.shape === 'coupe') && <path d="M -24 -37 L 8 -37 L 40 -5 L -24 -5 Z" fill="#1e293b" />}
                    {(car.shape === 'supercar') && <path d="M -16 -25 L 16 -25 L 48 -5 L -32 -5 Z" fill="#1e293b" />}
                    
                    {car.shape === 'jeep' && <path d="M -32 -72 L 40 -72 L 40 -15 L -32 -15 Z" fill="#1e293b" />}
                  </g>
                )}

                {/* Wheels (Using Config for position) */}
                <g transform={`translate(-${wheelX}, ${wheelY})`}>
                  <circle r={previewWheelSize} fill="#171717" stroke="black" strokeWidth="1" />
                  <circle r={previewWheelSize * 0.7} fill={car.wheelColor} />
                  <g stroke="#171717" strokeWidth="2">
                    <line x1="0" y1={-previewWheelSize * 0.7} x2="0" y2={previewWheelSize * 0.7} />
                    <line x1={-previewWheelSize * 0.6} y1={-previewWheelSize * 0.35} x2={previewWheelSize * 0.6} y2={previewWheelSize * 0.35} />
                    <line x1={-previewWheelSize * 0.6} y1={previewWheelSize * 0.35} x2={previewWheelSize * 0.6} y2={-previewWheelSize * 0.35} />
                  </g>
                </g>

                <g transform={`translate(${wheelX}, ${wheelY})`}>
                  <circle r={previewWheelSize} fill="#171717" stroke="black" strokeWidth="1" />
                  <circle r={previewWheelSize * 0.7} fill={car.wheelColor} />
                  <g stroke="#171717" strokeWidth="2">
                    <line x1="0" y1={-previewWheelSize * 0.7} x2="0" y2={previewWheelSize * 0.7} />
                    <line x1={-previewWheelSize * 0.6} y1={-previewWheelSize * 0.35} x2={previewWheelSize * 0.6} y2={previewWheelSize * 0.35} />
                    <line x1={-previewWheelSize * 0.6} y1={previewWheelSize * 0.35} x2={previewWheelSize * 0.6} y2={-previewWheelSize * 0.35} />
                  </g>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
