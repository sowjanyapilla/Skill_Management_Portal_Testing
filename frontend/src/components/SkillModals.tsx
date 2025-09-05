import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, PieLabelProps } from 'recharts';
import { X } from "lucide-react";

// --- Interfaces for fetched data ---
export interface MasterSkillMetrics {
    skill_name: string;
    total_employees: number;
    employees_with_skill_count: number;
    subskill_breakdown: { subskill_id: number; subskill_name: string; employee_percentage: number }[];
}

export interface SubskillMetrics {
    subskill_name: string;
    total_employees: number;
    employees_with_subskill_count: number;
    certification_data: { name: string; value: number }[];
    proficiency_data: { proficiency: string; count: number }[];
    experience_data: { bucket: string; count: number }[];
}

// --- Recharts colors ---
const PIE_COLORS = ['#0088FE', '#FF8042'];
const BAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Helper function to calculate dynamic Y-axis ticks
const getDynamicTicks = (maxCount: number) => {
    let step = 1;
    if (maxCount > 10) step = 5;
    if (maxCount > 50) step = 10;
    if (maxCount > 100) step = 25;
    if (maxCount > 200) step = 50;
    if (maxCount > 500) step = 100;
    if (maxCount > 1000) step = 200;

    const endValue = Math.ceil(maxCount / step) * step;
    const ticks = [];
    for (let i = 0; i <= endValue; i += step) {
        ticks.push(i);
    }
    return ticks;
};

// Custom label component for PieChart to prevent overlap, showing percentage
const renderCustomizedLabel = (props: PieLabelProps) => {
    const { cx, cy, midAngle, outerRadius, name, value } = props;
    if (cx === undefined || cy === undefined || midAngle === undefined || outerRadius === undefined || name === undefined || value === undefined) {
        return null;
    }
    const RADIAN = Math.PI / 180;
    // Position the label slightly outside the pie
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const percentageText = `${typeof value === 'number' ? value.toFixed(1) : value}%`;

    // Break the 'Not Skilled' label into two lines
    if (name === 'Not Skilled') {
        return (
            <text
                x={x}
                y={y}
                fill="#000"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{ fontSize: '12px' }}
            >
                <tspan x={x} dy="-0.5em">{name}:</tspan>
                <tspan x={x} dy="1em">{percentageText}</tspan>
            </text>
        );
    }

    return (
        <text
            x={x}
            y={y}
            fill="#000"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            style={{ fontSize: '12px' }}
        >
            {`${name}: ${percentageText}`}
        </text>
    );
};

// Custom label for Certification Pie Chart, showing raw value
const renderCertLabel = (props: PieLabelProps) => {
    const { cx, cy, midAngle, outerRadius, name, value } = props;
    if (cx === undefined || cy === undefined || midAngle === undefined || outerRadius === undefined || name === undefined || value === undefined) {
        return null;
    }
    const RADIAN = Math.PI / 180;
    // Position the label slightly outside the pie
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill="#000"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            style={{ fontSize: '12px' }}
        >
            {`${name}: ${value}`}
        </text>
    );
};

// --- Modal Components ---

interface MasterSkillModalProps {
    data: MasterSkillMetrics | null;
    onClose: () => void;
}

export const MasterSkillModal = ({ data, onClose }: MasterSkillModalProps) => {
    if (!data) return null;

    const skilledPercentage = data.total_employees > 0
        ? (data.employees_with_skill_count / data.total_employees) * 100
        : 0;
    const notSkilledPercentage = 100 - skilledPercentage;

    const skillCoverageData = [
        { name: 'Skilled', value: skilledPercentage },
        { name: 'Not Skilled', value: notSkilledPercentage },
    ];

    const subskillData = data.subskill_breakdown.map(s => ({
        ...s,
        percentage: s.employee_percentage
    }));

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white p-6 rounded-lg shadow-xl max-w-6xl w-full mx-4">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-4">{data.skill_name} Dashboard</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg md:col-span-1">
                        <h3 className="text-lg font-semibold text-center mb-2">Overall Skill Coverage</h3>
                        <p className="text-sm text-gray-500 text-center mb-4">{data.employees_with_skill_count} out of {data.total_employees} employees</p>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={skillCoverageData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    // Adjusted outerRadius to make the pie chart smaller
                                    outerRadius={80}
                                    fill="#8884d8"
                                    // Enabled labelLine for better connection between label and slice
                                    labelLine={true}
                                    // Using the custom label component to ensure labels are visible
                                    label={renderCustomizedLabel}
                                >
                                    {skillCoverageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : value} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                        <h3 className="text-lg font-semibold text-center mb-2">Sub-skill Adoption by Employees</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={subskillData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="subskill_name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={120}
                                    interval={0}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis
                                    label={{ value: 'Employees (%)', angle: -90, position: 'insideLeft', offset: -10 }}
                                    width={80}
                                    tickFormatter={(value) => typeof value === 'number' ? `${value.toFixed(0)}%` : value}
                                />
                                <Tooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : value} />
                                <Legend />
                                <Bar dataKey="percentage" fill="#4B5563" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface SubskillModalProps {
    data: SubskillMetrics | null;
    onClose: () => void;
}

export const SubskillModal = ({ data, onClose }: SubskillModalProps) => {
    if (!data) return null;

    const fullExperienceData = [
        { bucket: '< 1 year', count: 0 },
        { bucket: '1-2 years', count: 0 },
        { bucket: '2-3 years', count: 0 },
        { bucket: '3-4 years', count: 0 },
        { bucket: '4-5 years', count: 0 },
        { bucket: '5-6 years', count: 0 },
        { bucket: '6-7 years', count: 0 },
        { bucket: '7-8 years', count: 0 },
        { bucket: '8-9 years', count: 0 },
        { bucket: '9-10 years', count: 0 },
        { bucket: '10+ years', count: 0 },
    ];
    const experienceMap = new Map(data.experience_data.map(item => [item.bucket, item.count]));
    const formattedExperienceData = fullExperienceData.map(item => ({
        ...item,
        count: experienceMap.get(item.bucket) || 0,
    }));
    const maxExperienceCount = Math.max(...formattedExperienceData.map(d => d.count), 0);
    const experienceTicks = getDynamicTicks(maxExperienceCount);

    const fullProficiencyData = [
        { proficiency: '1 Stars', count: 0 },
        { proficiency: '2 Stars', count: 0 },
        { proficiency: '3 Stars', count: 0 },
        { proficiency: '4 Stars', count: 0 },
        { proficiency: '5 Stars', count: 0 },
    ];
    const proficiencyMap = new Map(data.proficiency_data.map(item => [item.proficiency, item.count]));
    const formattedProficiencyData = fullProficiencyData.map(item => ({
        ...item,
        count: proficiencyMap.get(item.proficiency) || 0,
    }));
    const maxProficiencyCount = Math.max(...formattedProficiencyData.map(d => d.count), 0);
    const proficiencyTicks = getDynamicTicks(maxProficiencyCount);


    const skilledPercentage = data.total_employees > 0
        ? (data.employees_with_subskill_count / data.total_employees) * 100
        : 0;
    const notSkilledPercentage = 100 - skilledPercentage;

    const skillCoverageData = [
        { name: 'Skilled', value: skilledPercentage },
        { name: 'Not Skilled', value: notSkilledPercentage },
    ];

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white p-6 rounded-lg shadow-xl max-w-7xl w-full mx-4">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-4">{data.subskill_name} Metrics</h2>

                <div className="flex flex-row overflow-x-auto space-x-6 pb-4">
                    <div className="bg-gray-50 p-4 rounded-lg flex-shrink-0 w-[420px]">
                        <h3 className="text-lg font-semibold text-center mb-2">Overall Sub-skill Coverage</h3>
                        <p className="text-sm text-gray-500 text-center mb-4">{data.employees_with_subskill_count} out of {data.total_employees} employees</p>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={skillCoverageData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    // Adjusted outerRadius to make the pie chart smaller
                                    outerRadius={80}
                                    fill="#8884d8"
                                    // Enabled labelLine for better connection between label and slice
                                    labelLine={true}
                                    // Using the custom label component to ensure labels are visible
                                    label={renderCustomizedLabel}
                                >
                                    {skillCoverageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : value} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg flex-shrink-0 w-[420px]">
                        <h3 className="text-lg font-semibold text-center mb-2">Experience Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={formattedExperienceData} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="bucket"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    interval={0}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                    label={{ value: 'Number of Employees', angle: -90, position: 'insideLeft', style: { fontSize: 10 }, offset: -5 }}
                                    width={90}
                                    tickFormatter={(value) => String(parseInt(value))}
                                    domain={[0, experienceTicks[experienceTicks.length - 1]]}
                                    ticks={experienceTicks}
                                />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg flex-shrink-0 w-[420px]">
                        <h3 className="text-lg font-semibold text-center mb-2">Proficiency Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={formattedProficiencyData} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="proficiency"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    interval={0}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                    label={{ value: 'Number of Employees', angle: -90, position: 'insideLeft', style: { fontSize: 10 }, offset: -5 }}
                                    width={90}
                                    tickFormatter={(value) => String(parseInt(value))}
                                    domain={[0, proficiencyTicks[proficiencyTicks.length - 1]]}
                                    ticks={proficiencyTicks}
                                />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg flex-shrink-0 w-[420px]">
                        <h3 className="text-lg font-semibold text-center mb-2">Certification Status</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.certification_data}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    // Adjusted outerRadius to make the pie chart smaller
                                    outerRadius={80}
                                    fill="#8884d8"
                                    // Enabled labelLine for better connection between label and slice
                                    labelLine={true}
                                    // Using a custom label component for visibility
                                    label={renderCertLabel}
                                >
                                    {data.certification_data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
