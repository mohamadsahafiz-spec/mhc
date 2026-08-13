import React, { useState } from 'react';
import { Building2, Layers, Cpu, MapPin, Mail, Phone, Plus, ChevronRight, Search } from 'lucide-react';
import { Customer, Plant, ProductionLine, Machine } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

interface CustomersPlantsProps {
  customers: Customer[];
  plants: Plant[];
  lines: ProductionLine[];
  machines: Machine[];
  onSelectMachine: (machineId: string) => void;
}

export const CustomersPlantsModule: React.FC<CustomersPlantsProps> = ({
  customers,
  plants,
  lines,
  machines,
  onSelectMachine
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const customerPlants = plants.filter((p) => p.customerId === selectedCustomer?.id);

  return (
    <div className="space-y-6 pb-12">
      {/* Customers Header Grid */}
      {customers.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="w-10 h-10 text-indigo-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold mb-1">No Customer Accounts</h3>
          <p className="text-xs text-slate-500 mb-4">No customer records found. Add a customer in Machine Passport to begin.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {customers.map((cust) => {
            const isSelected = cust.id === selectedCustomer?.id;
            return (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomerId(cust.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1A1D21] border-[#8B9DFF] shadow-lg'
                      : 'bg-blue-50 border-blue-500 shadow-md'
                    : isDark
                      ? 'bg-[#111315] border-[#2B323A] hover:bg-[#1A1D21]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="cyan" size="sm">{cust.industry}</Badge>
                  <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cust.plantsCount} Plants</span>
                </div>
                <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{cust.name}</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{cust.contactPerson}</p>
                <div className={`mt-3 pt-2 border-t text-[11px] font-mono flex justify-between ${
                  isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'
                }`}>
                  <span>{cust.email}</span>
                  <span>{cust.phone}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Customer Hierarchy Detail */}
      {selectedCustomer && (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div>
                <span className={`text-xs font-mono uppercase ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>Customer Infrastructure Tree</span>
                <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{selectedCustomer.name}</h2>
              </div>
              <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Add Plant Facility
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {customerPlants.map((plant) => {
              const plantLines = lines.filter((l) => l.plantId === plant.id);
              const plantMachines = machines.filter((m) => m.plantId === plant.id);

              return (
                <div key={plant.id} className={`p-5 rounded-xl border space-y-4 ${
                  isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg border ${
                        isDark ? 'bg-[#8ECDF7]/15 border-[#8ECDF7]/30 text-[#8ECDF7]' : 'bg-sky-100 border-sky-200 text-sky-800'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{plant.name}</h3>
                        <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {plant.location} • {plant.timezone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <Badge variant="indigo" size="sm">{plantLines.length} Production Lines</Badge>
                      <Badge variant="emerald" size="sm">{plantMachines.length} Laser Systems</Badge>
                    </div>
                  </div>

                  {/* Production Lines and Machines */}
                  <div className={`space-y-3 pl-2 sm:pl-4 border-l-2 ${
                    isDark ? 'border-[#8ECDF7]/30' : 'border-sky-300'
                  }`}>
                    {plantLines.map((line) => {
                      const lineMachines = plantMachines.filter((m) => m.productionLineId === line.id);
                      return (
                        <div key={line.id} className={`p-3 rounded-lg border ${
                          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Layers className={`w-4 h-4 ${isDark ? 'text-[#8ECDF7]' : 'text-sky-700'}`} />
                              <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{line.name}</span>
                              <span className="text-[10px] font-mono text-slate-500">({line.code})</span>
                            </div>
                            <Badge variant={line.criticality === 'CRITICAL' ? 'rose' : 'amber'} size="sm">
                              {line.criticality}
                            </Badge>
                          </div>
                          <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{line.description}</p>

                          {/* Machine Cards Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {lineMachines.map((m) => (
                              <div
                                key={m.id}
                                onClick={() => onSelectMachine(m.id)}
                                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${
                                  isDark
                                    ? 'bg-[#111315] border-[#2B323A] hover:border-[#8ECDF7]'
                                    : 'bg-slate-50 border-slate-200 hover:border-sky-500'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Cpu className={`w-4 h-4 group-hover:scale-110 transition-transform ${isDark ? 'text-[#8ECDF7]' : 'text-sky-700'}`} />
                                  <div>
                                    <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{m.model}</p>
                                    <p className="text-[10px] font-mono text-slate-500">{m.serialNumber}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs font-mono font-bold ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>{m.healthScore}%</span>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-600 inline ml-1" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
