import React, { useState } from 'react';
import { 
  Cpu, 
  Zap, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Activity, 
  Activity as HeartIcon,
  Image as ImageIcon, 
  Wrench, 
  Plus, 
  Layers,
  Edit3,
  Type,
  Trash2,
  X,
  Settings,
  Building2,
  ChevronDown,
  Copy,
  Archive,
  MapPin,
  ShieldCheck,
  MoreVertical,
  Upload,
  Download,
  FileJson,
  Check,
  Camera,
  Thermometer,
  Aperture
} from 'lucide-react';
import { Machine, MHCRecord, Customer } from '../../types';
import { MachineTemperatureWorkspace } from './MachineTemperatureWorkspace';
import { MachineLaserPowerWorkspace } from './MachineLaserPowerWorkspace';
import { MachineBeamProfileWorkspace } from './MachineBeamProfileWorkspace';
import { MachineProductProcessWorkspace } from './MachineProductProcessWorkspace';
import { INITIAL_CUSTOMERS } from '../../data/mockData';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { HealthGauge } from '../common/HealthGauge';
import { useTheme } from '../../context/ThemeContext';

import { 
  LaserEngine, 
  LaserMetrics, 
  MachineMetrics, 
  LaserHeadDomain, 
  formatLifeRemainingPercent,
  formatDate 
} from '../../utils/laserEngine';

interface MachinePassportProps {
  machines: Machine[];
  customers?: Customer[];
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  mhcRecords: MHCRecord[];
  onOpenMhcForMachine: (machineId: string) => void;
  onAddMachine?: (machine: Machine) => void;
  onEditMachine?: (machine: Machine) => void;
  onDeleteMachine?: (machineId: string) => void;
  onBatchImportMachines?: (machines: Machine[]) => void;
  onAddCustomer?: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
}

export const MachinePassportModule: React.FC<MachinePassportProps> = ({
  machines,
  customers: propsCustomers,
  selectedMachineId,
  onSelectMachine,
  mhcRecords,
  onOpenMhcForMachine,
  onAddMachine,
  onEditMachine,
  onDeleteMachine,
  onBatchImportMachines,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const sortedMachines = React.useMemo(() => {
    return LaserEngine.normalizeMachines(machines);
  }, [machines]);

  const selectedMachine = sortedMachines.find((m) => m.id === selectedMachineId) || sortedMachines[0] || machines[0];

  // Machine Passport Sub-Category Active Tab State ('lifecycle' | 'temperature' | 'laser_power' | 'beam_profile' | 'product_process')
  const [passportSubTab, setPassportSubTab] = useState<'lifecycle' | 'temperature' | 'laser_power' | 'beam_profile' | 'product_process'>('lifecycle');

  // Authoritative Machine Laser Lifecycle Metrics derived via LaserEngine
  const machineMetrics: MachineMetrics = React.useMemo(() => {
    return LaserEngine.calculateMachineMetrics(selectedMachine);
  }, [selectedMachine]);

  // Physical Meter Verification Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [targetLaserMetrics, setTargetLaserMetrics] = useState<LaserMetrics | null>(null);
  const [physicalMeterInput, setPhysicalMeterInput] = useState<string>('');
  const [verifyDateInput, setVerifyDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [verifyTimeInput, setVerifyTimeInput] = useState<string>('09:00');
  const [verifyReason, setVerifyReason] = useState<string>('Scheduled Preventive Maintenance Verification');

  // Laser Head Configuration Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configLaserHead, setConfigLaserHead] = useState<LaserHeadDomain | null>(null);
  const [configName, setConfigName] = useState('');
  const [configSerial, setConfigSerial] = useState('');
  const [configBaseHour, setConfigBaseHour] = useState('');
  const [configBaseTimestamp, setConfigBaseTimestamp] = useState('');
  const [configRatedLife, setConfigRatedLife] = useState('');
  const [configWarningLife, setConfigWarningLife] = useState('');
  const [configContingency, setConfigContingency] = useState('');

  // Add Laser Head Modal State
  const [isAddLaserModalOpen, setIsAddLaserModalOpen] = useState(false);
  const [addLaserName, setAddLaserName] = useState('');
  const [addLaserSerial, setAddLaserSerial] = useState('');
  const [addLaserBaseHour, setAddLaserBaseHour] = useState('');
  const [addLaserBaseDate, setAddLaserBaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [addLaserBaseTime, setAddLaserBaseTime] = useState('09:00');
  const [addLaserRatedLife, setAddLaserRatedLife] = useState('25000');

  // Laser Monitor JSON Import / Export State
  const [importPreviewModalOpen, setImportPreviewModalOpen] = useState(false);
  const [importResultModalOpen, setImportResultModalOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<{
    machinesFound: number;
    laserHeadsFound: number;
    existingMatched: number;
    newMachines: number;
    warnings: string[];
    mappedMachines: Machine[];
    importedMachineList: Machine[];
  } | null>(null);
  const [importResultSummary, setImportResultSummary] = useState<{
    machinesImported: number;
    laserHeadsImported: number;
    existingMatched: number;
    newMachines: number;
    warnings: string[];
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleTriggerImportFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const preview = LaserEngine.parseAndMapLaserMonitorJson(text, machines, customers);
        setImportPreviewData(preview);
        setImportPreviewModalOpen(true);
      } catch (err: any) {
        alert(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importPreviewData) return;

    if (onBatchImportMachines) {
      onBatchImportMachines(importPreviewData.mappedMachines);
    } else {
      importPreviewData.mappedMachines.forEach((m) => {
        if (onEditMachine) onEditMachine(m);
      });
    }

    setImportResultSummary({
      machinesImported: importPreviewData.machinesFound,
      laserHeadsImported: importPreviewData.laserHeadsFound,
      existingMatched: importPreviewData.existingMatched,
      newMachines: importPreviewData.newMachines,
      warnings: importPreviewData.warnings
    });

    setImportPreviewModalOpen(false);
    setImportResultModalOpen(true);
  };

  const handleExportJson = () => {
    LaserEngine.exportLaserLifecycleJson(machines);
  };

  // Handlers for Physical Meter Verification
  const handleOpenVerifyModal = (lm: LaserMetrics) => {
    setTargetLaserMetrics(lm);
    setPhysicalMeterInput(String(lm.estimatedCurrentHour ?? lm.baseLaserHour ?? 12000));
    setVerifyDateInput(new Date().toISOString().split('T')[0]);
    setVerifyTimeInput(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    setVerifyReason('Scheduled Preventive Maintenance Verification');
    setIsVerifyModalOpen(true);
  };

  const handleConfirmRecalibration = () => {
    if (!selectedMachine || !targetLaserMetrics) return;
    const actualHour = parseFloat(physicalMeterInput);
    if (isNaN(actualHour) || actualHour < 0) {
      showAlert('Please enter a valid non-negative physical meter reading.');
      return;
    }

    const timestampStr = `${verifyDateInput}T${verifyTimeInput}:00`;
    const timestamp = new Date(timestampStr);

    const updatedMachine = LaserEngine.executeRecalibration(
      selectedMachine,
      targetLaserMetrics.id,
      actualHour,
      verifyReason || 'Meter Verification',
      timestamp
    );

    if (onEditMachine) {
      onEditMachine(updatedMachine);
    }

    setIsVerifyModalOpen(false);
    showAlert(`Physical meter verified and recalibrated to ${actualHour.toLocaleString()} hrs!`);
  };

  // Handlers for Laser Config Modal
  const handleOpenConfigModal = (lm: LaserMetrics) => {
    const lh = (selectedMachine.lasers || selectedMachine.laserHeads || []).find(l => l.id === lm.id);
    setConfigLaserHead(lh || {
      id: lm.id,
      name: lm.name,
      serialNo: lm.serialNo,
      baseLaserHour: lm.baseLaserHour,
      baseTimestamp: lm.baseTimestamp,
      ratedLife: lm.ratedLife,
      warningLife: lm.warningLife,
      contingencyCeiling: lm.contingencyCeiling,
      calibrationHistory: lm.calibrationHistory
    });
    setConfigName(lm.name);
    setConfigSerial(lm.serialNo);
    setConfigBaseHour(lm.baseLaserHour !== null && lm.baseLaserHour !== undefined ? String(lm.baseLaserHour) : '');
    setConfigBaseTimestamp(lm.baseTimestamp || '');
    setConfigRatedLife(String(lm.ratedLife));
    setConfigWarningLife(String(lm.warningLife));
    setConfigContingency(String(lm.contingencyCeiling));
    setIsConfigModalOpen(true);
  };

  const handleSaveLaserConfig = () => {
    if (!selectedMachine || !configLaserHead) return;
    const updatedLaserHead: LaserHeadDomain = {
      ...configLaserHead,
      name: configName.trim() || 'Laser Head',
      serialNo: configSerial.trim() || 'SN-UNKNOWN',
      baseLaserHour: configBaseHour.trim() !== '' ? parseFloat(configBaseHour) : null,
      baseTimestamp: configBaseTimestamp.trim() !== '' ? configBaseTimestamp : null,
      ratedLife: parseFloat(configRatedLife) || 25000,
      warningLife: parseFloat(configWarningLife) || 20000,
      contingencyCeiling: parseFloat(configContingency) || 30000
    };

    const updatedMachine = LaserEngine.updateLaserInMachine(selectedMachine, configLaserHead.id, updatedLaserHead);
    if (onEditMachine) {
      onEditMachine(updatedMachine);
    }
    setIsConfigModalOpen(false);
    showAlert(`Laser head "${updatedLaserHead.name}" configuration updated.`);
  };

  const handleDeleteLaserHead = () => {
    if (!selectedMachine || !configLaserHead) return;
    const lasers = selectedMachine.lasers || selectedMachine.laserHeads || [];
    if (lasers.length <= 1) {
      showAlert('Cannot delete laser head. Machines must have at least one laser head.');
      return;
    }
    const updatedLasers = lasers.filter(l => l.id !== configLaserHead.id);
    const updatedMachine = {
      ...selectedMachine,
      lasers: updatedLasers,
      laserHeads: updatedLasers
    };
    if (onEditMachine) {
      onEditMachine(updatedMachine);
    }
    setIsConfigModalOpen(false);
    showAlert(`Laser head deleted.`);
  };

  // Handlers for Add Laser Modal
  const handleOpenAddLaser = () => {
    if (!selectedMachine) return;
    const currentCount = (selectedMachine.lasers || selectedMachine.laserHeads || []).length;
    setAddLaserName(`Laser Head #${currentCount + 1}`);
    setAddLaserSerial(`LZR-${selectedMachine.machineNumber ? selectedMachine.machineNumber.replace('MCH-', '') : '01'}-0${currentCount + 1}`);
    setAddLaserBaseHour('10000');
    setAddLaserBaseDate(new Date().toISOString().split('T')[0]);
    setAddLaserBaseTime('09:00');
    setAddLaserRatedLife('25000');
    setIsAddLaserModalOpen(true);
  };

  const handleSaveAddLaser = () => {
    if (!selectedMachine) return;
    const baseHr = parseFloat(addLaserBaseHour);
    const baseTs = `${addLaserBaseDate}T${addLaserBaseTime}:00`;
    const newLaserHead: LaserHeadDomain = {
      id: `lh-${Date.now()}`,
      name: addLaserName.trim() || 'Laser Head',
      serialNo: addLaserSerial.trim() || 'SN-GENERIC',
      baseLaserHour: !isNaN(baseHr) ? baseHr : 10000,
      baseTimestamp: baseTs,
      ratedLife: parseFloat(addLaserRatedLife) || 25000,
      warningLife: (parseFloat(addLaserRatedLife) || 25000) * 0.8,
      contingencyCeiling: (parseFloat(addLaserRatedLife) || 25000) * 1.2,
      calibrationHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          estimatedHour: !isNaN(baseHr) ? baseHr : 10000,
          actualHour: !isNaN(baseHr) ? baseHr : 10000,
          difference: 0,
          reason: 'Initial Baseline Set',
          rating: 'Initial Baseline'
        }
      ]
    };

    const updatedMachine = LaserEngine.addLaserToMachine(selectedMachine, newLaserHead);
    if (onEditMachine) {
      onEditMachine(updatedMachine);
    }
    setIsAddLaserModalOpen(false);
    showAlert(`New laser head "${newLaserHead.name}" added to machine.`);
  };

  // Customer List State
  const [customerList, setCustomerList] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('fsos_customer_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to initial
      }
    }
    return INITIAL_CUSTOMERS;
  });

  // Persist Customer List to LocalStorage
  React.useEffect(() => {
    localStorage.setItem('fsos_customer_list', JSON.stringify(customerList));
  }, [customerList]);

  // Toast / System Alert Notice
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  const showAlert = (msg: string) => {
    setSystemAlert(msg);
    setTimeout(() => setSystemAlert(null), 4000);
  };

  // Derive aggregated Customer Workspace Accounts
  const customers = React.useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      site: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      machineCount: number;
      avgHealth: number;
      pmDueCount: number;
      criticalAlerts: number;
      status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
    }>();

    // Seed customer records from customerList
    customerList.forEach((c) => {
      map.set(c.id, {
        id: c.id,
        name: c.name,
        site: c.industry || 'Global Cleanroom Operations',
        contactPerson: c.contactPerson,
        email: c.email,
        phone: c.phone,
        machineCount: 0,
        avgHealth: 0,
        pmDueCount: 0,
        criticalAlerts: 0,
        status: 'OPTIMAL'
      });
    });

    // Populate machine stats
    machines.forEach((m) => {
      let custId = m.customerId;
      if (!map.has(custId)) {
        const found = Array.from(map.values()).find((c) => c.name === m.customerName);
        if (found) {
          custId = found.id;
        } else {
          custId = m.customerId || `cust-${m.customerName.replace(/\s+/g, '-').toLowerCase()}`;
          map.set(custId, {
            id: custId,
            name: m.customerName,
            site: m.plantName || 'Primary Cleanroom Facility',
            machineCount: 0,
            avgHealth: 0,
            pmDueCount: 0,
            criticalAlerts: 0,
            status: 'OPTIMAL'
          });
        }
      }

      const item = map.get(custId)!;
      item.machineCount += 1;
      item.avgHealth += m.healthScore;
      if (m.status === 'NEEDS_CALIBRATION' || m.status === 'MAINTENANCE_DUE') {
        item.pmDueCount += 1;
      }
      if (m.status === 'OUT_OF_SERVICE' || m.healthScore < 70) {
        item.criticalAlerts += 1;
      }
      if (m.plantName && item.site === 'Global Cleanroom Operations') {
        item.site = m.plantName;
      }
    });

    // Normalize averages and statuses
    map.forEach((item) => {
      if (item.machineCount > 0) {
        item.avgHealth = Math.round(item.avgHealth / item.machineCount);
      } else {
        item.avgHealth = 100;
      }
      if (item.criticalAlerts > 0) {
        item.status = 'CRITICAL';
      } else if (item.pmDueCount > 0 || item.avgHealth < 85) {
        item.status = 'WARNING';
      } else {
        item.status = 'OPTIMAL';
      }
    });

    return Array.from(map.values());
  }, [customerList, machines]);

  // Active Selected Customer State
  const [activeCustomerId, setActiveCustomerId] = useState<string>(() => {
    return selectedMachine?.customerId || customerList[0]?.id || 'cust-1';
  });

  // Sync active customer if selectedMachine changes externally
  React.useEffect(() => {
    if (selectedMachine?.customerId && customerList.some(c => c.id === selectedMachine.customerId)) {
      setActiveCustomerId(selectedMachine.customerId);
    }
  }, [selectedMachine?.id, selectedMachine?.customerId, customerList]);

  const activeCustomer = customers.find((c) => c.id === activeCustomerId) || customers[0];

  // Filter machines for selected customer
  const filteredMachines = sortedMachines.filter(
    (m) => m.customerId === activeCustomerId || m.customerName === activeCustomer?.name
  );

  // Handle customer switching
  const handleSelectCustomer = (custId: string) => {
    setActiveCustomerId(custId);
    const targetCust = customers.find((c) => c.id === custId);
    const custMachines = sortedMachines.filter(
      (m) => m.customerId === custId || m.customerName === targetCust?.name
    );
    if (custMachines.length > 0) {
      if (!custMachines.some((m) => m.id === selectedMachine?.id)) {
        onSelectMachine(custMachines[0].id);
      }
    }
  };

  // Customer Card Action Dropdown State
  const [activeCustomerMenuId, setActiveCustomerMenuId] = useState<string | null>(null);
  // Machine Card Action Dropdown State
  const [activeMachineCardMenuId, setActiveMachineCardMenuId] = useState<string | null>(null);

  // Machine Photo Handlers
  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMachine) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const updatedPhotos = [...(selectedMachine.photos || []), result];
        if (onEditMachine) {
          onEditMachine({ ...selectedMachine, photos: updatedPhotos });
        }
        showAlert('New machine photo uploaded successfully.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReplacePhoto = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMachine) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const updatedPhotos = [...(selectedMachine.photos || [])];
        updatedPhotos[index] = result;
        if (onEditMachine) {
          onEditMachine({ ...selectedMachine, photos: updatedPhotos });
        }
        showAlert('Machine photo updated successfully.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    if (!selectedMachine) return;
    const updatedPhotos = (selectedMachine.photos || []).filter((_, i) => i !== index);
    if (onEditMachine) {
      onEditMachine({ ...selectedMachine, photos: updatedPhotos });
    }
    showAlert('Machine photo removed.');
  };

  // Customer CRUD Modals State
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isRenameCustomerModalOpen, setIsRenameCustomerModalOpen] = useState(false);
  const [isDeleteCustomerModalOpen, setIsDeleteCustomerModalOpen] = useState(false);

  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Customer Form State
  const [custForm, setCustForm] = useState({
    name: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: ''
  });

  // Customer Actions Handlers
  const handleOpenAddCustomer = () => {
    setCustForm({
      name: '',
      industry: 'Semiconductor & Optics Facility',
      contactPerson: 'Lead Operations Engineer',
      email: 'ops@cleanroom.com',
      phone: '+1 (555) 019-2831'
    });
    setIsAddCustomerModalOpen(true);
  };

  const handleSaveAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name.trim()) return;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: custForm.name.trim(),
      industry: custForm.industry.trim() || 'Precision Laser Cleanroom',
      contactPerson: custForm.contactPerson.trim() || 'Lead Operations Engineer',
      email: custForm.email.trim() || 'ops@cleanroom.com',
      phone: custForm.phone.trim() || '+1 (555) 019-2831',
      plantsCount: 1,
      activeContractsCount: 1
    };
    setCustomerList((prev) => [...prev, newCust]);
    if (onAddCustomer) onAddCustomer(newCust);
    setActiveCustomerId(newCust.id);
    setIsAddCustomerModalOpen(false);
    showAlert(`Customer account "${newCust.name}" created successfully.`);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setCustomerToEdit(c);
    setCustForm({
      name: c.name || '',
      industry: c.industry || '',
      contactPerson: c.contactPerson || '',
      email: c.email || '',
      phone: c.phone || ''
    });
    setIsEditCustomerModalOpen(true);
  };

  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToEdit || !custForm.name.trim()) return;
    const updatedName = custForm.name.trim();
    const updatedCust: Customer = {
      ...customerToEdit,
      name: updatedName,
      industry: custForm.industry.trim(),
      contactPerson: custForm.contactPerson.trim(),
      email: custForm.email.trim(),
      phone: custForm.phone.trim()
    };
    setCustomerList((prev) =>
      prev.map((c) => (c.id === customerToEdit.id ? updatedCust : c))
    );
    if (onEditCustomer) onEditCustomer(updatedCust);
    setIsEditCustomerModalOpen(false);
    showAlert(`Customer account "${updatedName}" updated successfully.`);
  };

  const handleOpenRenameCustomer = (c: Customer) => {
    setCustomerToEdit(c);
    setCustForm((prev) => ({ ...prev, name: c.name }));
    setIsRenameCustomerModalOpen(true);
  };

  const handleSaveRenameCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToEdit || !custForm.name.trim()) return;
    const updatedName = custForm.name.trim();
    const updatedCust: Customer = { ...customerToEdit, name: updatedName };
    setCustomerList((prev) =>
      prev.map((c) => (c.id === customerToEdit.id ? updatedCust : c))
    );
    if (onEditCustomer) onEditCustomer(updatedCust);
    setIsRenameCustomerModalOpen(false);
    showAlert(`Customer account renamed to "${updatedName}".`);
  };

  const handleOpenDeleteCustomer = (c: Customer) => {
    setCustomerToDelete(c);
    setIsDeleteCustomerModalOpen(true);
  };

  const handleConfirmDeleteCustomer = () => {
    if (!customerToDelete) return;
    const deletedId = customerToDelete.id;
    const deletedName = customerToDelete.name;

    // Check if customer has assigned machines
    const assignedMachines = machines.filter(
      (m) => m.customerId === deletedId || m.customerName === deletedName
    );

    if (assignedMachines.length > 0) {
      showAlert(
        `Cannot delete customer "${deletedName}". ${assignedMachines.length} machine(s) are assigned to this customer. Delete or reassign all machines first.`
      );
      setIsDeleteCustomerModalOpen(false);
      return;
    }

    setCustomerList((prev) => prev.filter((c) => c.id !== deletedId));
    if (onDeleteCustomer) onDeleteCustomer(deletedId);

    if (activeCustomerId === deletedId) {
      const remaining = customerList.filter((c) => c.id !== deletedId);
      if (remaining.length > 0) {
        setActiveCustomerId(remaining[0].id);
      }
    }
    setIsDeleteCustomerModalOpen(false);
    showAlert(`Customer account "${deletedName}" deleted.`);
  };

  const handleArchiveCustomer = (c: Customer) => {
    showAlert(`Customer account "${c.name}" marked as archived (placeholder).`);
  };

  // Action Menu Dropdown State
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  // Modal Visibility States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form States
  const [addForm, setAddForm] = useState({
    model: '',
    machineNumber: '',
    serialNumber: '',
    customerName: 'TSMC Microelectronics Fab 18',
    plantName: 'Tainan Cleanroom Fab 18A',
    productionLineName: 'Line 4 - Sub-3nm Silicon Annealing',
    status: 'OPERATIONAL' as Machine['status'],
    healthScore: 98,
    installationDate: new Date().toISOString().split('T')[0],
    baselineDate: new Date().toISOString().split('T')[0],
    laserHeadModel: 'TruPulse 2000 Main Oscillator'
  });

  const [editForm, setEditForm] = useState({
    model: '',
    machineNumber: '',
    serialNumber: '',
    customerName: '',
    plantName: '',
    productionLineName: '',
    status: 'OPERATIONAL' as Machine['status'],
    healthScore: 100,
    installationDate: '',
    baselineDate: ''
  });

  const [renameForm, setRenameForm] = useState({
    model: '',
    machineNumber: '',
    serialNumber: ''
  });

  const machineMhcs = selectedMachine ? mhcRecords.filter((r) => r.machineId === selectedMachine.id) : [];

  // Fleet Navigator Handlers
  const currentIndex = selectedMachine ? machines.findIndex((m) => m.id === selectedMachine.id) : -1;
  const handlePrevMachine = () => {
    if (machines.length === 0 || !selectedMachine) return;
    const prevIdx = (currentIndex - 1 + machines.length) % machines.length;
    onSelectMachine(machines[prevIdx].id);
  };

  const handleNextMachine = () => {
    if (machines.length === 0 || !selectedMachine) return;
    const nextIdx = (currentIndex + 1) % machines.length;
    onSelectMachine(machines[nextIdx].id);
  };

  const handleDuplicateMachine = () => {
    if (!selectedMachine) return;
    const duplicate: Machine = {
      ...selectedMachine,
      id: `mch-${Date.now()}`,
      machineNumber: `${selectedMachine.machineNumber}-COPY`,
      serialNumber: `SN-COPY-${Math.floor(100000 + Math.random() * 900000)}`,
      model: `${selectedMachine.model} (Copy)`
    };
    if (onAddMachine) {
      onAddMachine(duplicate);
    }
    onSelectMachine(duplicate.id);
    setIsActionMenuOpen(false);
  };

  const handleArchiveMachine = () => {
    if (!selectedMachine) return;
    const archived: Machine = {
      ...selectedMachine,
      status: 'OUT_OF_SERVICE'
    };
    if (onEditMachine) {
      onEditMachine(archived);
    }
    setIsActionMenuOpen(false);
    showAlert(`Machine ${selectedMachine.machineNumber} status changed to OUT_OF_SERVICE.`);
  };

  // Handlers
  const handleOpenAdd = () => {
    const activeCust = customerList.find((c) => c.id === activeCustomerId) || customerList[0];
    setAddForm({
      model: '',
      machineNumber: `MCH-${Math.floor(100 + Math.random() * 900)}`,
      serialNumber: `SN-TRU-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: activeCust?.name || selectedMachine?.customerName || 'TSMC Microelectronics Fab 18',
      plantName: activeCust?.site || selectedMachine?.plantName || 'Tainan Cleanroom Fab 18A',
      productionLineName: selectedMachine?.productionLineName || 'Line 4 - Sub-3nm Silicon Annealing',
      status: 'OPERATIONAL',
      healthScore: 98,
      installationDate: new Date().toISOString().split('T')[0],
      baselineDate: new Date().toISOString().split('T')[0],
      laserHeadModel: 'TruPulse 2000 Main Oscillator'
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const activeCust = customerList.find((c) => c.id === activeCustomerId) || customerList[0];
    const targetCustId = activeCust?.id || 'cust-1';
    const targetCustName = addForm.customerName || activeCust?.name || 'TSMC Microelectronics Fab 18';

    const newMachine: Machine = {
      id: `mch-${Date.now()}`,
      customerId: targetCustId,
      customerName: targetCustName,
      plantId: 'plant-1',
      plantName: addForm.plantName || activeCust?.site || 'Tainan Cleanroom Fab 18A',
      productionLineId: 'line-1',
      productionLineName: addForm.productionLineName || 'Line 4 - Sub-3nm Silicon Annealing',
      model: addForm.model || 'TRUMPF TruPulse 2000',
      machineNumber: addForm.machineNumber || `MCH-${Math.floor(100 + Math.random() * 900)}`,
      serialNumber: addForm.serialNumber || `SN-${Date.now().toString().slice(-8)}`,
      installationDate: addForm.installationDate,
      baselineDate: addForm.baselineDate,
      healthScore: Number(addForm.healthScore) || 98,
      status: addForm.status,
      photos: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
      ],
      lastMhcDate: new Date().toISOString().split('T')[0],
      nextMhcDate: '2026-10-15',
      laserHeads: [
        {
          id: `lh-${Date.now()}-1`,
          model: addForm.laserHeadModel || 'TruPulse 2000 Main Oscillator',
          serialNumber: `LH-SN-${Math.floor(1000 + Math.random() * 9000)}`,
          runningHours: 120,
          maxRecommendedHours: 10000,
          remainingHours: 9880,
          healthScore: 98,
          ratedPowerWatts: 250,
          powerOutputWatts: 249.2,
          wavelengthNm: 1064,
          beamQualityM2: 1.08,
          estimatedReplacementDate: '2029-01-15'
        }
      ],
      consumables: [
        {
          id: `con-${Date.now()}-1`,
          name: 'Fused Silica Protective Window',
          partNumber: 'FS-OPT-9941',
          currentLifePercent: 95,
          lastReplacedDate: new Date().toISOString().split('T')[0],
          status: 'OPTIMAL',
          estimatedDaysRemaining: 180
        },
        {
          id: `con-${Date.now()}-2`,
          name: 'DI Water Cooling Ion Filter',
          partNumber: 'FLT-CW-302',
          currentLifePercent: 90,
          lastReplacedDate: new Date().toISOString().split('T')[0],
          status: 'OPTIMAL',
          estimatedDaysRemaining: 120
        }
      ]
    };

    if (onAddMachine) {
      onAddMachine(newMachine);
    }
    setActiveCustomerId(targetCustId);
    onSelectMachine(newMachine.id);
    setIsAddModalOpen(false);
    showAlert(`New machine "${newMachine.model}" added under ${targetCustName}.`);
  };

  const handleOpenEdit = () => {
    if (!selectedMachine) return;
    setEditForm({
      model: selectedMachine.model || '',
      machineNumber: selectedMachine.machineNumber || '',
      serialNumber: selectedMachine.serialNumber || '',
      customerName: selectedMachine.customerName || '',
      plantName: selectedMachine.plantName || '',
      productionLineName: selectedMachine.productionLineName || '',
      status: selectedMachine.status || 'OPERATIONAL',
      healthScore: selectedMachine.healthScore || 100,
      installationDate: selectedMachine.installationDate || '',
      baselineDate: selectedMachine.baselineDate || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    const updated: Machine = {
      ...selectedMachine,
      model: editForm.model,
      machineNumber: editForm.machineNumber,
      serialNumber: editForm.serialNumber,
      customerName: editForm.customerName,
      plantName: editForm.plantName,
      productionLineName: editForm.productionLineName,
      status: editForm.status,
      healthScore: Number(editForm.healthScore),
      installationDate: editForm.installationDate,
      baselineDate: editForm.baselineDate
    };

    if (onEditMachine) {
      onEditMachine(updated);
    }
    setIsEditModalOpen(false);
  };

  const handleOpenRename = () => {
    if (!selectedMachine) return;
    setRenameForm({
      model: selectedMachine.model || '',
      machineNumber: selectedMachine.machineNumber || '',
      serialNumber: selectedMachine.serialNumber || ''
    });
    setIsRenameModalOpen(true);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    const updated: Machine = {
      ...selectedMachine,
      model: renameForm.model,
      machineNumber: renameForm.machineNumber,
      serialNumber: renameForm.serialNumber
    };

    if (onEditMachine) {
      onEditMachine(updated);
    }
    setIsRenameModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (selectedMachine && onDeleteMachine) {
      onDeleteMachine(selectedMachine.id);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* System Toast / Alert Banner */}
      {systemAlert && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-md ${
          isDark ? 'bg-indigo-950/80 border-[#8B9DFF]/40 text-[#8B9DFF]' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{systemAlert}</span>
          </div>
          <button
            onClick={() => setSystemAlert(null)}
            className="p-1 hover:opacity-75 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Layer 1 — Customer Workspace */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className={`w-5 h-5 ${isDark ? 'text-[#8B9DFF]' : 'text-indigo-600'}`} />
            <h2 className={`text-sm font-bold font-mono uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              Customer Workspace
            </h2>
            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              isDark ? 'bg-[#8B9DFF]/10 text-[#8B9DFF] border-[#8B9DFF]/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {customers.length} Accounts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono hidden md:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Select Customer Account to inspect plant equipment
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAddCustomer}
            >
              Add Customer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {customers.map((c) => {
            const isSelected = c.id === activeCustomerId;
            const isMenuOpen = activeCustomerMenuId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => handleSelectCustomer(c.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 relative group cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-gradient-to-br from-[#1E2228] to-[#16181C] border-[#8B9DFF] shadow-lg shadow-[#8B9DFF]/10 ring-1 ring-[#8B9DFF]/50'
                      : 'bg-white border-indigo-600 shadow-md ring-1 ring-indigo-500/30'
                    : isDark
                      ? 'bg-[#14171A] border-[#2B323A] hover:bg-[#1A1D21] hover:border-slate-600'
                      : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                {isSelected && (
                  <div className={`absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-20 rounded-tr-2xl overflow-hidden ${
                    isDark ? 'bg-[#8B9DFF] blur-xl' : 'bg-indigo-500 blur-xl'
                  }`} />
                )}

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1 pr-1">
                    <h3 className={`text-sm font-bold truncate ${
                      isSelected
                        ? isDark ? 'text-white' : 'text-slate-900'
                        : isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {c.name}
                    </h3>
                    <p className={`text-xs flex items-center gap-1 font-medium mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{c.site}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border ${
                      c.status === 'OPTIMAL'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        : c.status === 'WARNING'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    }`}>
                      {c.status}
                    </span>

                    {/* Customer Overflow Menu Button (⋮) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCustomerMenuId(isMenuOpen ? null : c.id);
                        }}
                        className={`p-1 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#1E2227] border-[#2B323A] text-slate-300 hover:text-white hover:bg-[#282E36]'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="Customer Actions"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Customer Actions Dropdown Menu */}
                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCustomerMenuId(null);
                            }}
                          />
                          <div
                            className={`absolute right-0 top-8 w-48 rounded-xl border shadow-xl z-30 py-1 text-xs font-semibold ${
                              isDark
                                ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 divide-y divide-[#2B323A]'
                                : 'bg-white border-slate-200 text-slate-800 divide-y divide-slate-100 shadow-xl'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCustomerMenuId(null);
                                  handleOpenEditCustomer(c);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                                  isDark ? 'hover:bg-[#282E36] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#8B9DFF]" />
                                Edit Customer
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCustomerMenuId(null);
                                  handleOpenRenameCustomer(c);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                                  isDark ? 'hover:bg-[#282E36] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <Type className="w-3.5 h-3.5 text-[#8ECDF7]" />
                                Rename Customer
                              </button>
                            </div>
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCustomerMenuId(null);
                                  handleArchiveCustomer(c);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                                  isDark ? 'hover:bg-[#282E36] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <Archive className="w-3.5 h-3.5 text-amber-500" />
                                Archive Account
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCustomerMenuId(null);
                                  handleOpenDeleteCustomer(c);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center gap-2 text-rose-500 transition-colors ${
                                  isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                Delete Customer
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`pt-2.5 mt-2 border-t flex items-center justify-between text-xs font-mono ${
                  isDark ? 'border-[#2B323A]/60 text-slate-400' : 'border-slate-200 text-slate-600'
                }`}>
                  <span className="flex items-center gap-1 font-semibold">
                    <Cpu className="w-3.5 h-3.5 text-[#8B9DFF]" />
                    {c.machineCount} {c.machineCount === 1 ? 'Asset' : 'Assets'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-500">{c.avgHealth}% Health</span>
                    {c.pmDueCount > 0 ? (
                      <span className="text-amber-500 font-bold">{c.pmDueCount} PM Due</span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">0 Alerts</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Part 4 — Add Customer Card */}
          <button
            type="button"
            onClick={handleOpenAddCustomer}
            className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[110px] transition-all group ${
              isDark
                ? 'border-[#2B323A] hover:border-[#8B9DFF] bg-[#14171A]/40 hover:bg-[#1A1D21]'
                : 'border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-white'
            }`}
          >
            <div className={`p-2 rounded-full transition-transform group-hover:scale-110 ${
              isDark ? 'bg-[#8B9DFF]/10 text-[#8B9DFF]' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <Plus className="w-4 h-4" />
            </div>
            <span className={`text-xs font-bold font-mono ${
              isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-indigo-600'
            }`}>
              Add Customer
            </span>
          </button>
        </div>
      </div>

      {/* Layer 2 — Machine Workspace */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Cpu className={`w-4 h-4 ${isDark ? 'text-[#8B9DFF]' : 'text-indigo-600'}`} />
            <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Managed Laser Fleet
            </h3>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isDark ? 'bg-[#8B9DFF]/10 text-[#8B9DFF] border-[#8B9DFF]/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {activeCustomer?.name}
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {filteredMachines.length} {filteredMachines.length === 1 ? 'Machine' : 'Machines'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelected}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              icon={<Upload className="w-3.5 h-3.5 text-indigo-500" />}
              onClick={handleTriggerImportFile}
              className="text-xs h-7 px-2.5 font-sans"
            >
              Import Laser Monitor JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={<Download className="w-3.5 h-3.5 text-sky-500" />}
              onClick={handleExportJson}
              className="text-xs h-7 px-2.5 font-sans"
            >
              Export Laser Lifecycle JSON
            </Button>
            <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
              isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {filteredMachines.filter(m => m.status === 'OPERATIONAL').length}/{filteredMachines.length} Operational
            </span>
            <span className={`text-[11px] hidden md:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeCustomer?.site || 'Cleanroom Site'}
            </span>
          </div>
        </div>

        {filteredMachines.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Card className="p-6 text-center col-span-full sm:col-span-1 lg:col-span-2">
              <Cpu className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                No laser machines assigned to {activeCustomer?.name}.
              </p>
            </Card>

            {/* Add Machine Card */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[110px] transition-all group ${
                isDark
                  ? 'border-[#2B323A] hover:border-[#8B9DFF] bg-[#14171A]/40 hover:bg-[#1A1D21]'
                  : 'border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <div className={`p-2 rounded-full transition-transform group-hover:scale-110 ${
                isDark ? 'bg-[#8B9DFF]/10 text-[#8B9DFF]' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <Plus className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold font-mono ${
                isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-indigo-600'
              }`}>
                Add Machine
              </span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMachines.map((m) => {
              const isSelected = m.id === selectedMachine?.id;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMachine(m.id)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 relative group cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-gradient-to-br from-[#1E2228] to-[#16181C] border-[#8B9DFF] shadow-lg shadow-[#8B9DFF]/10 ring-1 ring-[#8B9DFF]/50'
                        : 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                      : isDark
                        ? 'bg-[#14171A] border-[#2B323A] hover:bg-[#1A1D21] hover:border-slate-600'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isSelected
                          ? isDark ? 'bg-[#8B9DFF]/20 text-[#8B9DFF] border-[#8B9DFF]/40' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {m.machineNumber}
                      </span>
                      <Badge
                        variant={
                          m.status === 'OPERATIONAL'
                            ? 'emerald'
                            : m.status === 'NEEDS_CALIBRATION'
                              ? 'amber'
                              : m.status === 'MAINTENANCE_DUE'
                                ? 'purple'
                                : 'rose'
                        }
                      >
                        {m.status}
                      </Badge>
                    </div>

                    {/* Machine 3-Dot Action Menu */}
                    <div className="relative z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMachineCardMenuId(activeMachineCardMenuId === m.id ? null : m.id);
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
                        }`}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {activeMachineCardMenuId === m.id && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMachineCardMenuId(null);
                            }}
                          />
                          <div
                            className={`absolute right-0 mt-1 w-44 rounded-xl border shadow-xl z-30 py-1 text-xs transition-all ${
                              isDark
                                ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 divide-y divide-[#2B323A]'
                                : 'bg-white border-slate-200 text-slate-800 divide-y divide-slate-100 shadow-xl'
                            }`}
                          >
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMachineCardMenuId(null);
                                  onSelectMachine(m.id);
                                  handleOpenEdit();
                                }}
                                className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                                  isDark ? 'hover:bg-[#282E36] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#8B9DFF]" />
                                Edit Specifications
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMachineCardMenuId(null);
                                  onSelectMachine(m.id);
                                  setIsRenameModalOpen(true);
                                }}
                                className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                                  isDark ? 'hover:bg-[#282E36] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <Type className="w-3.5 h-3.5 text-[#8ECDF7]" />
                                Rename Asset
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMachineCardMenuId(null);
                                  onSelectMachine(m.id);
                                  handleDuplicateMachine();
                                }}
                                className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                                  isDark ? 'hover:bg-[#282E36] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <Copy className="w-3.5 h-3.5 text-amber-400" />
                                Duplicate Machine
                              </button>
                            </div>
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMachineCardMenuId(null);
                                  onSelectMachine(m.id);
                                  setIsDeleteModalOpen(true);
                                }}
                                className={`w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-500 transition-colors ${
                                  isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                Delete Machine
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <h4 className={`text-xs font-bold truncate ${
                    isSelected
                      ? isDark ? 'text-white' : 'text-slate-900'
                      : isDark ? 'text-slate-300' : 'text-slate-800'
                  }`}>
                    {m.model}
                  </h4>

                  <div className={`flex items-center justify-between mt-2.5 pt-2 border-t text-[11px] font-mono ${
                    isDark ? 'border-[#2B323A]/60' : 'border-slate-200'
                  }`}>
                    <span className={`font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {m.plantName}
                    </span>
                    <span className={`font-bold shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                      LaserEngine.getMachineHealthStatus(m) === 'PASS'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : LaserEngine.getMachineHealthStatus(m) === 'WARNING'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {LaserEngine.getMachineHealthStatus(m)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Part 1 — Add Machine Card */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[110px] transition-all group ${
                isDark
                  ? 'border-[#2B323A] hover:border-[#8B9DFF] bg-[#14171A]/40 hover:bg-[#1A1D21]'
                  : 'border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <div className={`p-2 rounded-full transition-transform group-hover:scale-110 ${
                isDark ? 'bg-[#8B9DFF]/10 text-[#8B9DFF]' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <Plus className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold font-mono ${
                isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-indigo-600'
              }`}>
                Add Machine
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Layer 2 & 3 & 4 — Machine Hero Cockpit / Empty State */}
      {!selectedMachine ? (
        <Card className="p-8 text-center space-y-4">
          <Cpu className="w-12 h-12 mx-auto text-slate-400 opacity-60" />
          <h2 className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            No Machine Selected / Available in Passport
          </h2>
          <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Register a new machine asset or select a customer workspace to track laser telemetry, health scores, and maintenance history.
          </p>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add Machine
          </Button>
        </Card>
      ) : (
        <>
          <div className={`p-6 rounded-2xl border relative transition-all ${
            isDark
              ? 'bg-gradient-to-br from-[#1A1D21] via-[#16181C] to-[#121417] border-[#2B323A] shadow-xl'
              : 'bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60 border-slate-200/90 shadow-md'
          }`}>
            {/* Accent background mesh wrapper with overflow-hidden */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className={`absolute -right-12 -top-12 w-64 h-64 rounded-full blur-3xl ${
                isDark ? 'bg-[#8B9DFF]/5' : 'bg-indigo-500/5'
              }`} />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              {/* Machine Core Identity (Layer 5 Rank 1 & 2) */}
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border tracking-wide ${
                    isDark ? 'bg-[#8ECDF7]/15 border-[#8ECDF7]/40 text-[#8ECDF7]' : 'bg-sky-50 border-sky-300 text-sky-800 font-bold'
                  }`}>
                    {selectedMachine.machineNumber}
                  </span>
                  <Badge
                    variant={
                      selectedMachine.status === 'OPERATIONAL'
                        ? 'emerald'
                        : selectedMachine.status === 'NEEDS_CALIBRATION'
                        ? 'amber'
                        : 'rose'
                    }
                    size="md"
                  >
                    {selectedMachine.status}
                  </Badge>
                  <span className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    SN: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{selectedMachine.serialNumber}</strong>
                  </span>
                </div>

                <div>
                  <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                    {selectedMachine.model}
                  </h1>
                  <div className={`flex items-center gap-2 mt-1 text-xs font-medium flex-wrap ${
                    isDark ? 'text-[#94A3B8]' : 'text-slate-600'
                  }`}>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#8B9DFF]" />
                      {selectedMachine.customerName}
                    </span>
                    <span className="opacity-40">•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedMachine.plantName}
                    </span>
                    <span className="opacity-40">•</span>
                    <span className="font-mono text-[11px] opacity-90">{selectedMachine.productionLineName}</span>
                  </div>
                </div>

                {/* Quick Machine Summary Telemetry Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className={`p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#111315]/80 border-[#2B323A]' : 'bg-white/80 border-slate-200 shadow-2xs'
                  }`}>
                    <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Installed</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{selectedMachine.installationDate}</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#111315]/80 border-[#2B323A]' : 'bg-white/80 border-slate-200 shadow-2xs'
                  }`}>
                    <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Next MHC</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>{selectedMachine.nextMhcDate}</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#111315]/80 border-[#2B323A]' : 'bg-white/80 border-slate-200 shadow-2xs'
                  }`}>
                    <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Laser Heads</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{selectedMachine.laserHeads?.length || 0} Active Unit(s)</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#111315]/80 border-[#2B323A]' : 'bg-white/80 border-slate-200 shadow-2xs'
                  }`}>
                    <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>MHC Logs</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>{machineMhcs.length} Recorded</span>
                  </div>
                </div>
              </div>

              {/* Health Gauge & Primary Workflow Actions (Layer 5 Rank 3, 4, 5) */}
              <div className={`flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-5 p-4 lg:p-0 rounded-2xl lg:bg-transparent ${
                isDark ? 'bg-[#111315]/50 border lg:border-0 border-[#2B323A]' : 'bg-white/60 border lg:border-0 border-slate-200'
              }`}>
                {/* Overall Health Status */}
                <div className="flex flex-col items-start sm:items-end gap-1 font-mono">
                  <span className="text-[10px] font-bold uppercase text-slate-400">ENGINEERING STATUS</span>
                  <Badge
                    variant={
                      LaserEngine.getMachineHealthStatus(selectedMachine) === 'PASS'
                        ? 'emerald'
                        : LaserEngine.getMachineHealthStatus(selectedMachine) === 'WARNING'
                        ? 'amber'
                        : 'rose'
                    }
                    size="lg"
                    className="font-bold text-xs px-3 py-1 tracking-wider"
                  >
                    {LaserEngine.getMachineHealthStatus(selectedMachine)}
                  </Badge>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Activity className="w-4 h-4" />}
                    onClick={() => onOpenMhcForMachine(selectedMachine.id)}
                  >
                    Execute Health Check
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Machine Passport Sub-Category Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setPassportSubTab('lifecycle')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                passportSubTab === 'lifecycle'
                  ? isDark
                    ? 'bg-[#8B9DFF]/20 text-[#8B9DFF] border border-[#8B9DFF]/40 shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Laser Lifecycle & Health
            </button>

            <button
              type="button"
              onClick={() => setPassportSubTab('temperature')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                passportSubTab === 'temperature'
                  ? isDark
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-xs'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              Machine Temperature
              {((selectedMachine?.temperatureRecords?.length || 0) > 0 || (selectedMachine?.manualTemperatureReadings?.length || 0) > 0) && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isDark ? 'bg-rose-500/30 text-rose-300' : 'bg-rose-100 text-rose-800'
                }`}>
                  {(selectedMachine?.temperatureRecords?.length || 0) + (selectedMachine?.manualTemperatureReadings?.length || 0)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPassportSubTab('laser_power')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                passportSubTab === 'laser_power'
                  ? isDark
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Laser Power
              {(selectedMachine?.laserPowerRecords?.length || 0) > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isDark ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedMachine.laserPowerRecords?.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPassportSubTab('beam_profile')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                passportSubTab === 'beam_profile'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-xs'
                    : 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Aperture className="w-3.5 h-3.5 text-cyan-400" />
              Beam Profile
              {(selectedMachine?.beamProfileRecords?.length || 0) > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isDark ? 'bg-cyan-500/30 text-cyan-300' : 'bg-cyan-100 text-cyan-800'
                }`}>
                  {selectedMachine.beamProfileRecords?.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPassportSubTab('product_process')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                passportSubTab === 'product_process'
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Product & Process
              {(selectedMachine?.productProcessRecords?.length || 0) > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isDark ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {selectedMachine.productProcessRecords?.length}
                </span>
              )}
            </button>
          </div>

          {passportSubTab === 'lifecycle' ? (
            <div className="space-y-6">
          {/* Hardware & Installation Telemetry */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <span className={`text-[11px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Production Line</span>
              <p className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{selectedMachine.productionLineName}</p>
            </div>
            <div>
              <span className={`text-[11px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Installation Date</span>
              <p className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{selectedMachine.installationDate}</p>
            </div>
            <div>
              <span className={`text-[11px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Factory Baseline Date</span>
              <p className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{selectedMachine.baselineDate}</p>
            </div>
            <div>
              <span className={`text-[11px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Next MHC Target</span>
              <p className={`text-xs font-bold mt-0.5 ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>{selectedMachine.nextMhcDate}</p>
            </div>
          </div>

          {/* Laser Heads Runtime Telemetry & Lifecycle Module */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Laser Heads Runtime Telemetry & Lifecycle Engine
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Live deterministic lifecycle tracking based on physical meter baseline & elapsed runtime
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    machineMetrics.status === 'SAFE' ? 'emerald' :
                    machineMetrics.status === 'WARNING' ? 'amber' :
                    machineMetrics.status === 'ALARM' ? 'rose' : 'amber'
                  }
                  size="md"
                >
                  SYSTEM: {machineMetrics.status.replace('_', ' ')}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleOpenAddLaser}
                  className="text-xs"
                >
                  Add Laser Head
                </Button>
              </div>
            </div>

            {/* Baseline Required Warning Banner */}
            {machineMetrics.baselineRequiredCount > 0 && (
              <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    <strong>Baseline Required:</strong> Physical meter reading has not been recorded for {machineMetrics.baselineRequiredCount} laser head(s). Please verify physical meter to activate lifecycle engine.
                  </span>
                </div>
              </div>
            )}

            {/* Per-Laser Head Lifecycle Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {machineMetrics.laserMetricsList.map((lm) => {
                const isBaselineReq = lm.status === 'BASELINE_REQUIRED';
                const percentUsed = lm.lifeRemainingPercent !== null 
                  ? Math.min(100, Math.max(0, 100 - lm.lifeRemainingPercent))
                  : 0;

                return (
                  <div key={lm.id} className={`p-4 rounded-xl border space-y-3.5 transition-all ${
                    lm.status === 'ALARM'
                      ? (isDark ? 'bg-rose-950/20 border-rose-800/60' : 'bg-rose-50/80 border-rose-200')
                      : lm.status === 'WARNING'
                      ? (isDark ? 'bg-amber-950/20 border-amber-800/60' : 'bg-amber-50/80 border-amber-200')
                      : (isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200')
                  }`}>
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Zap className={`w-4 h-4 shrink-0 ${
                          lm.status === 'ALARM' ? 'text-rose-500' :
                          lm.status === 'WARNING' ? 'text-amber-500' :
                          isDark ? 'text-[#EFCB7A]' : 'text-amber-600'
                        }`} />
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {lm.name}
                          </span>
                          <span className={`text-[10px] font-mono block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            SN: {lm.serialNo}
                          </span>
                        </div>
                      </div>

                      <Badge 
                        variant={
                          lm.status === 'SAFE' ? 'emerald' :
                          lm.status === 'WARNING' ? 'amber' :
                          lm.status === 'ALARM' ? 'rose' : 'amber'
                        } 
                        size="sm"
                      >
                        {lm.status === 'BASELINE_REQUIRED' ? 'BASELINE REQ' : lm.status}
                      </Badge>
                    </div>

                    {/* Progress Bar / Rated Life */}
                    <div className="space-y-1 text-xs font-mono">
                      <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                        <span>Current Estimated:</span>
                        <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {lm.currentHour !== null ? `${lm.currentHour.toLocaleString()} / ${lm.ratedLife.toLocaleString()} hrs` : 'Unset'}
                        </span>
                      </div>

                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            lm.status === 'ALARM' ? 'bg-rose-500' :
                            lm.status === 'WARNING' ? 'bg-amber-500' :
                            isDark ? 'bg-[#8ECDF7]' : 'bg-sky-600'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>

                      <div className={`flex justify-between text-[10px] pt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <span>Life Remaining: <strong className={lm.status === 'ALARM' ? 'text-rose-400' : lm.status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}>{lm.formattedLifeRemaining}</strong></span>
                        <span>Est. EOL: {lm.estimatedRecommendedEOL || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Grid Metrics */}
                    <div className={`grid grid-cols-2 gap-2 text-[11px] font-mono p-2.5 rounded-lg border ${
                      isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-white border-slate-200'
                    }`}>
                      <div>
                        <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Physical Meter:</span>
                        <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          {lm.baseLaserHour !== null ? `${lm.baseLaserHour.toLocaleString()} hrs` : 'Not Set'}
                        </p>
                      </div>
                      <div>
                        <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Remaining Hours:</span>
                        <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          {lm.recommendedRemainingHour !== null ? `${lm.recommendedRemainingHour.toLocaleString()} hrs` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Remaining Days:</span>
                        <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          {lm.remainingDaysInfo.formattedText}
                        </p>
                      </div>
                      <div>
                        <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Freshness:</span>
                        <p className={`font-bold ${lm.accuracy.color === 'emerald' ? 'text-emerald-400' : lm.accuracy.color === 'amber' ? 'text-amber-400' : 'text-slate-400'}`}>
                          {lm.accuracy.label}
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant={isBaselineReq ? 'warning' : 'primary'}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenVerifyModal(lm)}
                        className="flex-1 text-xs py-1.5"
                      >
                        {isBaselineReq ? 'Set Physical Baseline' : 'Verify Physical Meter'}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Settings className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenConfigModal(lm)}
                        className="text-xs py-1.5"
                        title="Configure Laser Head & Calibration History"
                      >
                        Config
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Maintenance & MHC Log History */}
          <Card title="Machine Health Check Log">
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {machineMhcs.length === 0 ? (
                <p className={`text-xs py-4 text-center ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>No past MHC records.</p>
              ) : (
                machineMhcs.map((rec) => (
                  <div key={rec.id} className={`p-2.5 rounded-lg border flex justify-between items-center text-xs ${
                    isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{rec.date}</span>
                      <p className={`text-[10px] truncate max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>{rec.engineerRemarks}</p>
                    </div>
                    <Badge variant="cyan" size="sm">{rec.healthScores.overallScore}/100</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
        ) : passportSubTab === 'temperature' ? (
          <MachineTemperatureWorkspace
            machine={selectedMachine}
            onUpdateMachine={(updated) => onEditMachine?.(updated)}
          />
        ) : passportSubTab === 'laser_power' ? (
          <MachineLaserPowerWorkspace
            machine={selectedMachine}
            onUpdateMachine={(updated) => onEditMachine?.(updated)}
          />
        ) : passportSubTab === 'beam_profile' ? (
          <MachineBeamProfileWorkspace
            machine={selectedMachine}
            onUpdateMachine={(updated) => onEditMachine?.(updated)}
          />
        ) : (
          <MachineProductProcessWorkspace
            machine={selectedMachine}
            onUpdateMachine={(updated) => onEditMachine?.(updated)}
          />
        )}
        </>
      )}

      {/* 1. Add Machine Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Machine to Fleet Passport"
        subtitle="Register a new machine asset with hardware baseline and customer allocation."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Machine Model / Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TRUMPF TruLaser Cell 7040"
                value={addForm.model}
                onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Machine ID / Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MCH-105"
                value={addForm.machineNumber}
                onChange={(e) => setAddForm({ ...addForm, machineNumber: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Serial Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SN-TRU-904128"
                value={addForm.serialNumber}
                onChange={(e) => setAddForm({ ...addForm, serialNumber: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Customer Allocation
              </label>
              <input
                type="text"
                value={addForm.customerName}
                onChange={(e) => setAddForm({ ...addForm, customerName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Plant / Facility Name
              </label>
              <input
                type="text"
                value={addForm.plantName}
                onChange={(e) => setAddForm({ ...addForm, plantName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Production Line
              </label>
              <input
                type="text"
                value={addForm.productionLineName}
                onChange={(e) => setAddForm({ ...addForm, productionLineName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Initial Status
              </label>
              <select
                value={addForm.status}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.value as Machine['status'] })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="NEEDS_CALIBRATION">NEEDS_CALIBRATION</option>
                <option value="MAINTENANCE_DUE">MAINTENANCE_DUE</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>
            </div>



            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Installation Date
              </label>
              <input
                type="date"
                value={addForm.installationDate}
                onChange={(e) => setAddForm({ ...addForm, installationDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Laser Oscillator / Head Model
              </label>
              <input
                type="text"
                value={addForm.laserHeadModel}
                onChange={(e) => setAddForm({ ...addForm, laserHeadModel: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Create Machine
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Machine Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Machine: ${selectedMachine?.model || ''}`}
        subtitle={`Update operational parameters and specs for ${selectedMachine?.machineNumber || ''}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Machine Model
              </label>
              <input
                type="text"
                required
                value={editForm.model}
                onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Machine Number
              </label>
              <input
                type="text"
                required
                value={editForm.machineNumber}
                onChange={(e) => setEditForm({ ...editForm, machineNumber: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Serial Number
              </label>
              <input
                type="text"
                required
                value={editForm.serialNumber}
                onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Customer Name
              </label>
              <input
                type="text"
                value={editForm.customerName}
                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Plant Name
              </label>
              <input
                type="text"
                value={editForm.plantName}
                onChange={(e) => setEditForm({ ...editForm, plantName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Production Line Name
              </label>
              <input
                type="text"
                value={editForm.productionLineName}
                onChange={(e) => setEditForm({ ...editForm, productionLineName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Machine['status'] })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="NEEDS_CALIBRATION">NEEDS_CALIBRATION</option>
                <option value="MAINTENANCE_DUE">MAINTENANCE_DUE</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>
            </div>


          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Edit3 className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Rename Machine Modal */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Quick Rename Machine"
        subtitle={`Update model designation or machine code for ${selectedMachine?.machineNumber || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveRename} className="space-y-4 p-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Machine Model Name
            </label>
            <input
              type="text"
              required
              value={renameForm.model}
              onChange={(e) => setRenameForm({ ...renameForm, model: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Machine Number / Code
            </label>
            <input
              type="text"
              required
              value={renameForm.machineNumber}
              onChange={(e) => setRenameForm({ ...renameForm, machineNumber: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Serial Number
            </label>
            <input
              type="text"
              required
              value={renameForm.serialNumber}
              onChange={(e) => setRenameForm({ ...renameForm, serialNumber: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsRenameModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Type className="w-4 h-4" />}
            >
              Rename Machine
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Delete Machine Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Machine"
        subtitle="This action is permanent and cannot be undone."
        maxWidth="md"
      >
        <div className="p-4 space-y-4">
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Are you sure you want to delete this machine?</p>
              <p>
                Target: <strong className="font-mono">{selectedMachine?.model || ''} ({selectedMachine?.machineNumber || ''})</strong>
              </p>
              <p className="text-[11px] opacity-80 pt-1">
                SN: {selectedMachine?.serialNumber || ''} • {selectedMachine?.customerName || ''}
              </p>
            </div>
          </div>

          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Deleting this machine will remove its telemetry, active laser head specifications, and consumable records from the active fleet passport.
          </p>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleConfirmDelete}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. Add Customer Modal */}
      <Modal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        title="Create Customer Account"
        subtitle="Add a new customer account to FSOS Customer Workspace"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAddCustomer} className="space-y-4 p-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Customer Account Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., TSMC Fab 21 Cleanroom"
              value={custForm.name}
              onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Facility / Industry Site
            </label>
            <input
              type="text"
              placeholder="e.g., EUV Wafer Dicing Facility"
              value={custForm.industry}
              onChange={(e) => setCustForm({ ...custForm, industry: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Contact Person
              </label>
              <input
                type="text"
                placeholder="Dr. Robert Chen"
                value={custForm.contactPerson}
                onChange={(e) => setCustForm({ ...custForm, contactPerson: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Contact Email
              </label>
              <input
                type="email"
                placeholder="a.rivera@fab.com"
                value={custForm.email}
                onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Edit Customer Modal */}
      <Modal
        isOpen={isEditCustomerModalOpen}
        onClose={() => setIsEditCustomerModalOpen(false)}
        title="Edit Customer Details"
        subtitle={`Modify account information for ${customerToEdit?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditCustomer} className="space-y-4 p-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Customer Account Name *
            </label>
            <input
              type="text"
              required
              value={custForm.name}
              onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Facility / Industry Site
            </label>
            <input
              type="text"
              value={custForm.industry}
              onChange={(e) => setCustForm({ ...custForm, industry: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Contact Person
              </label>
              <input
                type="text"
                value={custForm.contactPerson}
                onChange={(e) => setCustForm({ ...custForm, contactPerson: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Contact Email
              </label>
              <input
                type="email"
                value={custForm.email}
                onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Edit3 className="w-4 h-4" />}
            >
              Save Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Rename Customer Modal */}
      <Modal
        isOpen={isRenameCustomerModalOpen}
        onClose={() => setIsRenameCustomerModalOpen(false)}
        title="Rename Customer Account"
        subtitle={`Update account name for ${customerToEdit?.name}`}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveRenameCustomer} className="space-y-4 p-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              New Customer Name
            </label>
            <input
              type="text"
              required
              value={custForm.name}
              onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsRenameCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Type className="w-4 h-4" />}
            >
              Rename Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Delete Customer Confirmation Modal */}
      {(() => {
        const assignedMachinesCount = customerToDelete
          ? machines.filter((m) => m.customerId === customerToDelete.id || m.customerName === customerToDelete.name).length
          : 0;

        return (
          <Modal
            isOpen={isDeleteCustomerModalOpen}
            onClose={() => setIsDeleteCustomerModalOpen(false)}
            title="Confirm Delete Customer Account"
            subtitle="This action will remove the customer account."
            maxWidth="md"
          >
            <div className="p-4 space-y-4">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Are you sure you want to delete this customer account?</p>
                  <p>
                    Account: <strong className="font-mono">{customerToDelete?.name}</strong>
                  </p>
                  <p className="text-[11px] opacity-80 pt-1">
                    Facility: {customerToDelete?.industry || 'Cleanroom Operations'}
                  </p>
                </div>
              </div>

              {assignedMachinesCount > 0 ? (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Customer Deletion Blocked:</strong> {assignedMachinesCount} machine(s) are assigned to this customer. You must delete or reassign all machines before this customer account can be deleted.
                  </span>
                </div>
              ) : (
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Deleting this customer account will permanently remove it from the Customer Workspace navigation hierarchy.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteCustomerModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={assignedMachinesCount > 0}
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={handleConfirmDeleteCustomer}
                >
                  Confirm Delete Customer
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* 9. Verify Physical Laser Meter Modal */}
      {isVerifyModalOpen && targetLaserMetrics && (() => {
        const estHr = targetLaserMetrics.estimatedCurrentHour ?? targetLaserMetrics.baseLaserHour ?? 0;
        const enteredHr = parseFloat(physicalMeterInput) || 0;
        const dev = enteredHr - estHr;
        const absDev = Math.abs(dev);
        const evalRating = LaserEngine.calculateDeviationRating(dev);

        return (
          <Modal
            isOpen={isVerifyModalOpen}
            onClose={() => setIsVerifyModalOpen(false)}
            title={`Verify Physical Meter — ${targetLaserMetrics.name}`}
            subtitle={`Machine: ${selectedMachine.model} (${selectedMachine.machineNumber}) • Serial: ${targetLaserMetrics.serialNo}`}
            maxWidth="md"
          >
            <div className="p-4 space-y-4">
              {/* Estimated vs Physical Banner */}
              <div className={`p-4 rounded-xl border grid grid-cols-2 gap-3 text-xs ${
                isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`block text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Live Estimated Hour
                  </span>
                  <span className={`text-base font-extrabold font-mono ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>
                    {estHr.toLocaleString()} hrs
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Calculated via LaserEngine
                  </span>
                </div>

                <div>
                  <span className={`block text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Last Physical Meter
                  </span>
                  <span className={`text-base font-extrabold font-mono ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    {targetLaserMetrics.baseLaserHour !== null ? `${targetLaserMetrics.baseLaserHour.toLocaleString()} hrs` : 'Unset'}
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {targetLaserMetrics.baseTimestamp ? formatDate(targetLaserMetrics.baseTimestamp) : 'No baseline recorded'}
                  </span>
                </div>
              </div>

              {/* Physical Meter Form */}
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Physical Meter Reading (hrs) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={physicalMeterInput}
                    onChange={(e) => setPhysicalMeterInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono font-bold border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Verification Date
                    </label>
                    <input
                      type="date"
                      required
                      value={verifyDateInput}
                      onChange={(e) => setVerifyDateInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                        isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Verification Time
                    </label>
                    <input
                      type="time"
                      required
                      value={verifyTimeInput}
                      onChange={(e) => setVerifyTimeInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                        isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Reason / Engineer Notes
                  </label>
                  <select
                    value={verifyReason}
                    onChange={(e) => setVerifyReason(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Scheduled Preventive Maintenance Verification">Scheduled PM Verification</option>
                    <option value="Routine Inspection Audit">Routine Inspection Audit</option>
                    <option value="Diode Module / Optics Service Baseline">Diode Module / Optics Service Baseline</option>
                    <option value="Laser Recalibration & Alignment">Laser Recalibration & Alignment</option>
                    <option value="Customer Cleanroom Handover Verification">Customer Cleanroom Handover Verification</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Real-Time Deviation Feedback */}
              <div className={`p-3.5 rounded-xl border space-y-1.5 text-xs font-mono ${
                absDev > 500 ? (isDark ? 'bg-amber-950/30 border-amber-800/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900') :
                (isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900')
              }`}>
                <div className="flex justify-between items-center font-bold">
                  <span>Meter Deviation:</span>
                  <span>{dev > 0 ? `+${dev.toLocaleString()}` : dev.toLocaleString()} hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Accuracy Rating:</span>
                  <span className="font-bold">{evalRating.rating}</span>
                </div>
                {evalRating.warningMsg && (
                  <div className="text-[11px] text-amber-500 font-semibold pt-1">
                    {evalRating.warningMsg}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVerifyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleConfirmRecalibration}
                >
                  Confirm & Recalibrate Baseline
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* 10. Laser Head Configuration & Calibration History Modal */}
      {isConfigModalOpen && configLaserHead && (
        <Modal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          title={`Laser Head Configuration & Calibration Log — ${configName}`}
          subtitle={`Machine: ${selectedMachine.model} (${selectedMachine.machineNumber})`}
          maxWidth="lg"
        >
          <div className="p-4 space-y-5">
            {/* Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Laser Head Model / Name
                </label>
                <input
                  type="text"
                  required
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Serial Number
                </label>
                <input
                  type="text"
                  required
                  value={configSerial}
                  onChange={(e) => setConfigSerial(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border font-mono ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Rated Lifetime Hours
                </label>
                <input
                  type="number"
                  required
                  value={configRatedLife}
                  onChange={(e) => setConfigRatedLife(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border font-mono ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Warning Life Threshold (hrs)
                </label>
                <input
                  type="number"
                  required
                  value={configWarningLife}
                  onChange={(e) => setConfigWarningLife(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border font-mono ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Calibration Audit Log Table */}
            <div className="space-y-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Physical Meter Calibration & Recalibration Audit Log
              </h4>

              <div className={`rounded-xl border overflow-hidden text-xs font-mono max-h-48 overflow-y-auto ${
                isDark ? 'border-[#2B323A] bg-[#111315]' : 'border-slate-200 bg-white'
              }`}>
                {(!configLaserHead.calibrationHistory || configLaserHead.calibrationHistory.length === 0) ? (
                  <p className="p-4 text-center text-slate-500">No recalibration history recorded for this laser head.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={isDark ? 'bg-[#1A1D21] text-slate-400 border-b border-[#2B323A]' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}>
                        <th className="p-2">Date/Time</th>
                        <th className="p-2">Est. Hour</th>
                        <th className="p-2">Actual Hour</th>
                        <th className="p-2">Dev</th>
                        <th className="p-2">Rating</th>
                        <th className="p-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800">
                      {configLaserHead.calibrationHistory.map((rec, i) => (
                        <tr key={i} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                          <td className="p-2 font-bold">{rec.date} {rec.time || ''}</td>
                          <td className="p-2">{rec.estimatedHour?.toLocaleString()}</td>
                          <td className="p-2 text-emerald-400 font-bold">{rec.actualHour?.toLocaleString()}</td>
                          <td className="p-2">{rec.difference > 0 ? `+${rec.difference}` : rec.difference}</td>
                          <td className="p-2">{rec.rating}</td>
                          <td className="p-2 max-w-xs truncate text-[10px] text-slate-400">{rec.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleDeleteLaserHead}
                disabled={(selectedMachine.lasers || selectedMachine.laserHeads || []).length <= 1}
              >
                Delete Laser Head
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsConfigModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Edit3 className="w-4 h-4" />}
                  onClick={handleSaveLaserConfig}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 11. Add Laser Head Modal */}
      {isAddLaserModalOpen && (
        <Modal
          isOpen={isAddLaserModalOpen}
          onClose={() => setIsAddLaserModalOpen(false)}
          title={`Add Laser Head — ${selectedMachine.model}`}
          subtitle="Configure a multi-laser head system for independent lifecycle tracking."
          maxWidth="md"
        >
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Laser Head Name / Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addLaserName}
                  onChange={(e) => setAddLaserName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="e.g. TRUMPF TruLaser Oscillator #2"
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Serial Number
                </label>
                <input
                  type="text"
                  required
                  value={addLaserSerial}
                  onChange={(e) => setAddLaserSerial(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Physical Meter Reading (hrs) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={addLaserBaseHour}
                  onChange={(e) => setAddLaserBaseHour(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Rated Life (hrs)
                </label>
                <input
                  type="number"
                  required
                  value={addLaserRatedLife}
                  onChange={(e) => setAddLaserRatedLife(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Baseline Date
                </label>
                <input
                  type="date"
                  value={addLaserBaseDate}
                  onChange={(e) => setAddLaserBaseDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Baseline Time
                </label>
                <input
                  type="time"
                  value={addLaserBaseTime}
                  onChange={(e) => setAddLaserBaseTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddLaserModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleSaveAddLaser}
              >
                Add Laser Head
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 1. Import Preview Modal */}
      {importPreviewModalOpen && importPreviewData && (
        <Modal
          isOpen={importPreviewModalOpen}
          onClose={() => setImportPreviewModalOpen(false)}
          title="Laser Monitor JSON Import Preview"
          size="md"
        >
          <div className="space-y-4">
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Parsed backup file from Laser Hour Monitor. Preview of machines and laser lifecycle configurations to be imported into FSOS:
            </p>

            <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl font-mono text-xs border ${
              isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Machines Found</span>
                <strong className="text-base text-indigo-400 font-bold">{importPreviewData.machinesFound}</strong>
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Laser Heads Found</span>
                <strong className="text-base text-sky-400 font-bold">{importPreviewData.laserHeadsFound}</strong>
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Existing Matched (Merge)</span>
                <strong className="text-base text-amber-400 font-bold">{importPreviewData.existingMatched}</strong>
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">New Machines (Add)</span>
                <strong className="text-base text-emerald-400 font-bold">{importPreviewData.newMachines}</strong>
              </div>
            </div>

            {importPreviewData.warnings && importPreviewData.warnings.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Validation Warnings ({importPreviewData.warnings.length})</span>
                </div>
                <ul className="text-[11px] text-amber-400/90 list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto font-mono">
                  {importPreviewData.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={`p-3 rounded-xl border text-xs space-y-2 ${
              isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-bold text-slate-300 flex justify-between items-center">
                <span>LaserEngine Lifecycle Calculation Authority</span>
                <Badge variant="emerald">ACTIVE</Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                Imported baseline physical hours (<code className="text-amber-400 font-mono">baseLaserHour</code> + <code className="text-amber-400 font-mono">baseTimestamp</code>) will be processed by native FSOS LaserEngine. LIVE running hours, status, and EOL prognosis will be derived deterministically without altering historical baselines.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImportPreviewModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Upload className="w-4 h-4" />}
                onClick={handleConfirmImport}
              >
                Import
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Import Result Modal */}
      {importResultModalOpen && importResultSummary && (
        <Modal
          isOpen={importResultModalOpen}
          onClose={() => setImportResultModalOpen(false)}
          title="Laser Monitor Import Completed"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
              <div>
                <strong className="block font-bold">Import Successful</strong>
                <span>All imported machines and laser heads are now fully bound to FSOS Machine Passport, MHC, Smart MHC Data Tray, and Executive Reports.</span>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-xl border ${
              isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Machines Processed:</span>
                <strong className="text-white">{importResultSummary.machinesImported}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Laser Heads Imported:</span>
                <strong className="text-white">{importResultSummary.laserHeadsImported}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Merged Existing:</span>
                <strong className="text-amber-400">{importResultSummary.existingMatched}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">New Added:</span>
                <strong className="text-emerald-400">{importResultSummary.newMachines}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setImportResultModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
