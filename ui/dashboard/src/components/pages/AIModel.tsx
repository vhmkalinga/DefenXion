import { useState, useEffect } from 'react';
import { Brain, Zap, Database, TrendingUp, Activity, CheckCircle, AlertCircle, Loader2, Trash2, Power, Eye } from 'lucide-react';
import { getModelStats, trainNewModel, getDeployedModels, activateModel, deleteModel, getModelDetails } from '../../services/api';
import { StatCard } from '../StatCard';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Hardcoded constants removed in favor of dynamic `activeModel` properties

export function AIModel() {
  const [modelStats, setModelStats] = useState<any>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState('');
  const [detailModel, setDetailModel] = useState<any>(null);

  // Editable training configuration
  const [configAlgorithm, setConfigAlgorithm] = useState('random_forest');
  const [configDataset, setConfigDataset] = useState('CICIDS2017');
  const [configUseLiveData, setConfigUseLiveData] = useState(true);
  const [configEstimators, setConfigEstimators] = useState(100);
  const [configMaxDepth, setConfigMaxDepth] = useState<number | null>(null);
  const [configSampleSize, setConfigSampleSize] = useState(50000);

  const ALGORITHMS = [
    { value: 'random_forest', label: 'Random Forest' },
    { value: 'gradient_boosting', label: 'Gradient Boosting' },
    { value: 'decision_tree', label: 'Decision Tree' },
    { value: 'extra_trees', label: 'Extra Trees' },
    { value: 'knn', label: 'K-Nearest Neighbors' },
    { value: 'svm', label: 'Support Vector Machine' },
  ];

  const DATASETS = [
    { value: 'CICIDS2017', label: 'CICIDS2017' },
    { value: 'UNSW-NB15', label: 'UNSW-NB15' },
  ];

  // Default fallback model (shown when MongoDB has no trained models yet)
  const fallbackModel = {
    name: 'RandomForest IDS',
    status: 'Active',
    accuracy: modelStats?.accuracy || 98.2,
    version: 'rf_original',
    lastTrained: '2025-10-21',
    predictionTime: modelStats?.predictionTime || '12ms',
    samples: '2.4M',
    n_estimators: 100,
    training_time_seconds: 0,
    sample_size: 2262300,
    total_features: 78,
  };

  const [deployedModels, setDeployedModels] = useState<any[]>([fallbackModel]);

  const fetchModels = () => {
    getDeployedModels()
      .then(models => {
        if (models && models.length > 0) {
          setDeployedModels(models);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    getModelStats().then(res => { if (res) setModelStats(res); }).catch(console.error);
    fetchModels();
  }, []);

  // Poll for training completion when training is active
  useEffect(() => {
    if (!isTraining) return;
    const interval = setInterval(() => {
      getDeployedModels()
        .then(models => {
          if (models && models.length > deployedModels.length) {
            setDeployedModels(models);
            setIsTraining(false);
            setTrainingMessage('');
            toast.success('New model trained and deployed successfully!');
          }
        })
        .catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, [isTraining, deployedModels.length]);

  const activeModel = deployedModels.find(m => m.status === 'Active') || deployedModels[0] || fallbackModel;

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[#E6EDF3]">AI Model Management</h2>
        <Button
          className="bg-[#1F6FEB] hover:bg-[#1F6FEB]/90 gap-2"
          disabled={isTraining}
          onClick={async () => {
            setIsTraining(true);
            setTrainingMessage('Training in progress... This may take 15-30 seconds.');
            try {
              const res = await trainNewModel({
                algorithm: configAlgorithm,
                dataset_name: configDataset,
                use_live_data: configUseLiveData,
                n_estimators: configEstimators,
                max_depth: configMaxDepth,
                sample_size: configSampleSize,
              });
              toast.info(res.message || 'Training job started.');
            } catch (error) {
              toast.error('Failed to start training pipeline');
              setIsTraining(false);
              setTrainingMessage('');
            }
          }}
        >
          {isTraining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {isTraining ? 'Training...' : 'Train New Model'}
        </Button>
      </div>

      {trainingMessage && (
        <div className="bg-[#1F6FEB]/10 border border-[#1F6FEB]/30 rounded-xl p-4 mb-6 text-[#58A6FF] text-sm flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          {trainingMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Model Accuracy"
          value={activeModel?.accuracy ? `${activeModel.accuracy}%` : 'N/A'}
          change="+Active"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Training Samples"
          value={activeModel?.sample_size ? `${(activeModel.sample_size / 1000).toFixed(0)}K` : 'N/A'}
          change="Samples"
          icon={<Database className="w-5 h-5" />}
        />
        <StatCard
          title="Inference Speed"
          value={activeModel?.predictionTime || '12ms'}
          change="~avg"
          icon={<Zap className="w-5 h-5" />}
        />
        <StatCard
          title="Active Models"
          value={String(deployedModels.filter(m => m.status === 'Active').length)}
          icon={<Brain className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
          <h3 className="text-[#E6EDF3] mb-6">Top Features (Feature Importance)</h3>
          <ResponsiveContainer width="100%" height={280}>
            {activeModel?.feature_importances && activeModel.feature_importances.length > 0 ? (
              <BarChart data={activeModel.feature_importances} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis dataKey="feature" stroke="#7D8590" angle={-35} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                <YAxis width={60} stroke="#7D8590" label={{ value: 'Importance', angle: -90, position: 'insideLeft', fill: '#7D8590', fontSize: 12, offset: -5 }} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161B22',
                    border: '1px solid #30363D',
                    borderRadius: '8px',
                    color: '#E6EDF3'
                  }}
                />
                <Bar dataKey="importance" fill="#3FB950" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <div className="flex items-center justify-center h-full text-[#7D8590]">
                Feature importance data not available for this model type.
              </div>
            )}
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
          <h3 className="text-[#E6EDF3] mb-6">Detection Accuracy by Threat Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            {activeModel?.threat_detection_accuracy && activeModel.threat_detection_accuracy.length > 0 ? (
              <BarChart data={activeModel.threat_detection_accuracy} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis dataKey="category" stroke="#7D8590" angle={-25} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                <YAxis width={60} stroke="#7D8590" domain={[0, 100]} label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', fill: '#7D8590', fontSize: 12, offset: -5 }} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161B22',
                    border: '1px solid #30363D',
                    borderRadius: '8px',
                    color: '#E6EDF3'
                  }}
                />
                <Bar dataKey="accuracy" fill="#1F6FEB" radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : (
              <div className="flex items-center justify-center h-full text-[#7D8590]">
                Detection accuracy data not available yet.
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D] mb-6">
        <h3 className="text-[#E6EDF3] mb-6">Deployed Models</h3>
        <div className="space-y-4">
          {deployedModels.map((model: any, idx: number) => (
            <div key={model.version || idx} className="bg-[#0D1117] border border-[#30363D] rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-[#E6EDF3]">{model.name || 'RandomForest IDS'}</h4>
                    <Badge
                      variant="outline"
                      className={model.status === 'Active' ? 'border-[#3FB950] text-[#3FB950]' : 'border-[#7D8590] text-[#7D8590]'}
                    >
                      {model.status === 'Active' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                      {model.status}
                    </Badge>
                    <span className="text-[#7D8590] text-sm">{model.version}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-[#7D8590]">Accuracy: </span>
                      <span className="text-[#E6EDF3]">{model.accuracy}%</span>
                    </div>
                    <div>
                      <span className="text-[#7D8590]">F1 Score: </span>
                      <span className="text-[#E6EDF3]">{model.f1_score || model.accuracy}%</span>
                    </div>
                    <div>
                      <span className="text-[#7D8590]">Trained: </span>
                      <span className="text-[#E6EDF3]">{model.timestamp || model.lastTrained || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[#7D8590]">Samples: </span>
                      <span className="text-[#E6EDF3]">{model.sample_size ? `${(model.sample_size / 1000).toFixed(0)}K` : model.samples || '2.4M'}</span>
                    </div>
                  </div>
                  {model.training_time_seconds > 0 && (
                    <div className="text-[#7D8590] text-xs mt-2">
                      Trained in {model.training_time_seconds}s • {model.n_estimators} trees • {model.total_features} features
                      {model.triggered_by && ` • by ${model.triggered_by}`}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#30363D] text-[#E6EDF3] gap-1"
                    onClick={async () => {
                      try {
                        const details = await getModelDetails(model.version);
                        setDetailModel(details);
                      } catch {
                        toast.error('Failed to load model details');
                      }
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    Details
                  </Button>
                  {model.status !== 'Active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#3FB950]/30 text-[#3FB950] gap-1 hover:bg-[#3FB950]/10"
                      onClick={async () => {
                        try {
                          const res = await activateModel(model.version);
                          toast.success(res.message);
                          fetchModels();
                        } catch {
                          toast.error('Failed to activate model');
                        }
                      }}
                    >
                      <Power className="w-3 h-3" />
                      Activate
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#30363D] text-[#E6EDF3] gap-1"
                    disabled={isTraining}
                    onClick={async () => {
                      setIsTraining(true);
                      setTrainingMessage(`Retraining ${model.name || 'model'}...`);
                      try {
                        const res = await trainNewModel({
                          algorithm: model.algorithm || 'random_forest',
                          dataset_name: configDataset,
                          use_live_data: configUseLiveData,
                          n_estimators: model.n_estimators || configEstimators,
                          max_depth: model.max_depth || configMaxDepth,
                          sample_size: model.sample_size || configSampleSize,
                        });
                        toast.info(res.message);
                      } catch {
                        toast.error('Failed to start retraining');
                        setIsTraining(false);
                        setTrainingMessage('');
                      }
                    }}
                  >
                    <Loader2 className={`w-3 h-3 ${isTraining ? 'animate-spin' : ''}`} />
                    Retrain
                  </Button>
                  {model.status !== 'Active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#FF4D4D]/30 text-[#FF4D4D] gap-1 hover:bg-[#FF4D4D]/10"
                      onClick={async () => {
                        if (!confirm(`Delete model ${model.version}? This cannot be undone.`)) return;
                        try {
                          const res = await deleteModel(model.version);
                          toast.success(res.message);
                          fetchModels();
                          if (detailModel?.version === model.version) setDetailModel(null);
                        } catch (err: any) {
                          toast.error(err?.response?.data?.detail || 'Failed to delete model');
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#7D8590]">Performance</span>
                  <span className="text-[#E6EDF3]">{model.accuracy}%</span>
                </div>
                <Progress value={model.accuracy} className="h-2 bg-[#30363D]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Detail Modal */}
      {detailModel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#1F6FEB]/40 w-full max-w-3xl shadow-2xl m-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#E6EDF3]">
              Model Details — {detailModel.name || 'Unknown Model'}
              <span className="text-[#7D8590] text-sm ml-2">({detailModel.version})</span>
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="border-[#30363D] text-[#E6EDF3]"
              onClick={() => setDetailModel(null)}
            >
              Close
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0D1117] rounded-lg p-4 border border-[#30363D]">
              <div className="text-[#7D8590] text-xs mb-1">Accuracy</div>
              <div className="text-[#3FB950] text-2xl font-bold">{detailModel.accuracy}%</div>
            </div>
            <div className="bg-[#0D1117] rounded-lg p-4 border border-[#30363D]">
              <div className="text-[#7D8590] text-xs mb-1">Precision</div>
              <div className="text-[#58A6FF] text-2xl font-bold">{detailModel.precision || 'N/A'}%</div>
            </div>
            <div className="bg-[#0D1117] rounded-lg p-4 border border-[#30363D]">
              <div className="text-[#7D8590] text-xs mb-1">Recall</div>
              <div className="text-[#D29922] text-2xl font-bold">{detailModel.recall || 'N/A'}%</div>
            </div>
            <div className="bg-[#0D1117] rounded-lg p-4 border border-[#30363D]">
              <div className="text-[#7D8590] text-xs mb-1">F1 Score</div>
              <div className="text-[#BC8CFF] text-2xl font-bold">{detailModel.f1_score || 'N/A'}%</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <span className="text-[#7D8590]">Algorithm: </span>
              <span className="text-[#E6EDF3]">{detailModel.algorithm?.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Random Forest'}</span>
            </div>
            <div>
              <span className="text-[#7D8590]">Status: </span>
              <span className={detailModel.status === 'Active' ? 'text-[#3FB950]' : 'text-[#7D8590]'}>{detailModel.status}</span>
            </div>
            <div>
              <span className="text-[#7D8590]">Trained: </span>
              <span className="text-[#E6EDF3]">{detailModel.timestamp || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#7D8590]">n_estimators: </span>
              <span className="text-[#E6EDF3]">{detailModel.n_estimators || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#7D8590]">max_depth: </span>
              <span className="text-[#E6EDF3]">{detailModel.max_depth || 'None'}</span>
            </div>
            <div>
              <span className="text-[#7D8590]">Features: </span>
              <span className="text-[#E6EDF3]">{detailModel.total_features || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#7D8590]">Training Samples: </span>
              <span className="text-[#E6EDF3]">{detailModel.sample_size ? `${(detailModel.sample_size / 1000).toFixed(0)}K` : 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#7D8590]">Training Time: </span>
              <span className="text-[#E6EDF3]">{detailModel.training_time_seconds ? `${detailModel.training_time_seconds}s` : 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#7D8590]">Triggered By: </span>
              <span className="text-[#E6EDF3]">{detailModel.triggered_by || 'system'}</span>
            </div>
          </div>
          </div>
        </div>
      )}

      <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[#E6EDF3]">Model Configuration</h3>
          <Button
            variant="outline"
            size="sm"
            className="border-[#30363D] text-[#E6EDF3]"
            onClick={() => toast.success('Configuration saved! These values will be used for the next training run.')}
          >
            Save Config
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-[#7D8590] text-sm mb-2">Training Dataset</div>
              <select
                value={configDataset}
                onChange={(e) => setConfigDataset(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#1F6FEB] transition-colors cursor-pointer mb-4"
              >
                {DATASETS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              
              <label className="flex items-center space-x-3 cursor-pointer mt-4">
                <input 
                  type="checkbox" 
                  checked={configUseLiveData} 
                  onChange={(e) => setConfigUseLiveData(e.target.checked)} 
                  className="w-4 h-4 rounded border-[#30363D] bg-[#0D1117] text-[#1F6FEB] focus:ring-[#1F6FEB] focus:ring-offset-[#1E232B]"
                />
                <span className="text-[#E6EDF3] text-sm">Include Live System Captured Traffic (Online Learning)</span>
              </label>
            </div>
            <div>
              <div className="text-[#7D8590] text-sm mb-2">Machine Learning Architecture</div>
              <select
                value={configAlgorithm}
                onChange={(e) => setConfigAlgorithm(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#1F6FEB] transition-colors cursor-pointer"
              >
                {ALGORITHMS.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[#7D8590] text-sm mb-2 block">n_estimators</label>
              <input
                type="number"
                min={10}
                max={500}
                value={configEstimators}
                onChange={(e) => setConfigEstimators(parseInt(e.target.value) || 100)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#1F6FEB] transition-colors"
              />
            </div>
            <div>
              <label className="text-[#7D8590] text-sm mb-2 block">sample_size</label>
              <input
                type="number"
                min={1000}
                max={2000000}
                step={10000}
                value={configSampleSize}
                onChange={(e) => setConfigSampleSize(parseInt(e.target.value) || 50000)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#1F6FEB] transition-colors"
              />
              <div className="text-[#7D8590] text-xs mt-1">Higher = slower training, better accuracy. Max: 2,262,300</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[#7D8590] text-sm mb-2">criterion</div>
              <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-[#E6EDF3] text-sm">
                gini
              </div>
            </div>
            <div>
              <label className="text-[#7D8590] text-sm mb-2 block">max_depth</label>
              <input
                type="number"
                min={1}
                max={100}
                value={configMaxDepth ?? ''}
                placeholder="None (unlimited)"
                onChange={(e) => setConfigMaxDepth(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#1F6FEB] transition-colors placeholder:text-[#484F58]"
              />
              <div className="text-[#7D8590] text-xs mt-1">Leave empty for unlimited depth</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
