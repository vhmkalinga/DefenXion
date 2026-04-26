import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ThreatAnalysisModal } from '../ThreatAnalysisModal';
import { AnimatePresence } from 'motion/react';
import { getAllThreats } from '../../services/api';
import { downloadCSV } from '../../utils/export';

export function DetectedThreats() {
  const [threats, setThreats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedThreat, setSelectedThreat] = useState<any | null>(null);

  useEffect(() => {
    getAllThreats(1, 100)
      .then(res => {
        if (res && res.data) setThreats(res.data);
      })
      .catch(console.error);
  }, []);

  const filteredThreats = threats.filter(threat => {
    const matchesSearch = threat.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.sourceIp.includes(searchTerm) ||
      threat.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || threat.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'border-[#FF4D4D] text-[#FF4D4D]';
      case 'High': return 'border-[#FFA657] text-[#FFA657]';
      case 'Medium': return 'border-[#58A6FF] text-[#58A6FF]';
      default: return 'border-[#7D8590] text-[#7D8590]';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Blocked': return 'border-[#FF4D4D] text-[#FF4D4D]';
      case 'Quarantined': return 'border-[#FFA657] text-[#FFA657]';
      case 'Flagged': return 'border-[#58A6FF] text-[#58A6FF]';
      default: return 'border-[#7D8590] text-[#7D8590]';
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[#E6EDF3]">Detected Threats</h2>
        <Button
          className="bg-[#1F6FEB] hover:bg-[#1F6FEB]/90 gap-2"
          onClick={() => downloadCSV(filteredThreats, 'detected-threats.csv')}
        >
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D] mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8590]" />
            <Input
              type="text"
              placeholder="Search by ID, type, or IP address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-[#0D1117] border-[#30363D] text-[#E6EDF3]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#161B22] border-[#30363D]">
              <SelectItem value="all" className="text-[#E6EDF3]">All Severities</SelectItem>
              <SelectItem value="Critical" className="text-[#E6EDF3]">Critical</SelectItem>
              <SelectItem value="High" className="text-[#E6EDF3]">High</SelectItem>
              <SelectItem value="Medium" className="text-[#E6EDF3]">Medium</SelectItem>
              <SelectItem value="Low" className="text-[#E6EDF3]">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#30363D] hover:bg-transparent">
                <TableHead className="text-[#7D8590]">ID</TableHead>
                <TableHead className="text-[#7D8590]">Timestamp</TableHead>
                <TableHead className="text-[#7D8590]">Threat Type</TableHead>
                <TableHead className="text-[#7D8590]">Severity</TableHead>
                <TableHead className="text-[#7D8590]">Source IP</TableHead>
                <TableHead className="text-[#7D8590]">Port</TableHead>
                <TableHead className="text-[#7D8590]">Confidence</TableHead>
                <TableHead className="text-[#7D8590]">Status</TableHead>
                <TableHead className="text-[#7D8590]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredThreats.map((threat) => (
                <TableRow key={threat.id} className="border-[#30363D] hover:bg-[#161B22]">
                  <TableCell className="text-[#58A6FF] font-mono text-sm">{threat.id}</TableCell>
                  <TableCell className="text-[#C9D1D9] text-sm">{threat.timestamp}</TableCell>
                  <TableCell className="text-[#E6EDF3]">{threat.type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSeverityColor(threat.severity)}>
                      {threat.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#C9D1D9] font-mono text-sm">{threat.sourceIp}</TableCell>
                  <TableCell className="text-[#C9D1D9] text-sm">{threat.targetPort}</TableCell>
                  <TableCell className="text-[#C9D1D9] text-sm">{threat.confidence}%</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(threat.status)}>
                      {threat.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#58A6FF] hover:text-[#1F6FEB] hover:bg-[#161B22]"
                      onClick={() => setSelectedThreat(threat)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AnimatePresence>
        {selectedThreat && (
          <ThreatAnalysisModal
            threat={selectedThreat}
            onClose={() => setSelectedThreat(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
