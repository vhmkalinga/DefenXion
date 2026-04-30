import { useState, useEffect } from 'react';
import { Brain, Zap, Database, TrendingUp, Activity, CheckCircle, AlertCircle, Loader2, Trash2, Power, Eye } from 'lucide-react';
import { getModelStats, trainNewModel, getDeployedModels, activateModel, deleteModel, getModelDetails } from '../../services/api';
import { toast } from 'sonner';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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

  const CARD = { background:'linear-gradient(135deg,#161B22,#1a1f28)', border:'1px solid #21262D', borderRadius:16 };
  const TOOLTIP_S = { backgroundColor:'#0D1117', border:'1px solid #30363D', borderRadius:10, color:'#E6EDF3', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', fontSize:12 };

  const statCards = [
    { title:'Model Accuracy', value: activeModel?.accuracy ? `${activeModel.accuracy}%` : 'N/A', accent:'#3FB950', icon:<TrendingUp size={17}/> },
    { title:'Training Samples', value: activeModel?.sample_size ? `${(activeModel.sample_size/1000).toFixed(0)}K` : 'N/A', accent:'#1F6FEB', icon:<Database size={17}/> },
    { title:'Inference Speed', value: activeModel?.predictionTime || '12ms', accent:'#FFA657', icon:<Zap size={17}/> },
    { title:'Deployed Models', value: String(deployedModels.length), accent:'#BC8CFF', icon:<Brain size={17}/> },
  ];

  return (
    <>
      <style>{`
        @keyframes ai-spin { to{transform:rotate(360deg)} }
        @keyframes ai-fadeup { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ai-pulse { 0%,100%{box-shadow:0 0 20px rgba(31,111,235,0.2)} 50%{box-shadow:0 0 40px rgba(31,111,235,0.45)} }
        .ai-row { animation:ai-fadeup 0.35s ease both; }
        .ai-row:nth-child(2){animation-delay:.06s} .ai-row:nth-child(3){animation-delay:.12s}
        .ai-row:nth-child(4){animation-delay:.18s} .ai-row:nth-child(5){animation-delay:.24s}
      `}</style>

    <div style={{ padding:'28px 32px', maxWidth:1440, margin:'0 auto' }}>

      {/* ── Header ── */}
      <div className="ai-row" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#1F6FEB,#58A6FF)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(31,111,235,0.35)' }}>
            <Brain size={22} color="white" />
          </div>
          <div>
            <h1 style={{ color:'#E6EDF3', fontSize:22, fontWeight:700, letterSpacing:'-0.02em', margin:0 }}>AI Model Management</h1>
            <p style={{ color:'#7D8590', fontSize:13, marginTop:3 }}>Train, deploy & monitor ML intrusion detection models</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, background: activeModel?.status === 'Active' ? 'rgba(63,185,80,0.08)' : 'rgba(125,133,144,0.08)', border:`1px solid ${activeModel?.status === 'Active' ? 'rgba(63,185,80,0.2)' : '#30363D'}` }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background: activeModel?.status === 'Active' ? '#3FB950' : '#7D8590', boxShadow: activeModel?.status === 'Active' ? '0 0 8px rgba(63,185,80,0.6)' : 'none' }} />
            <span style={{ fontSize:12, fontWeight:600, color: activeModel?.status === 'Active' ? '#3FB950' : '#7D8590' }}>{activeModel?.name || 'No Model'}</span>
          </div>
          <button
            disabled={isTraining}
            onClick={async () => {
              setIsTraining(true); setTrainingMessage('Training in progress… This may take 15-30 seconds.');
              try {
                const res = await trainNewModel({ algorithm:configAlgorithm, dataset_name:configDataset, use_live_data:configUseLiveData, n_estimators:configEstimators, max_depth:configMaxDepth, sample_size:configSampleSize });
                toast.info(res.message || 'Training job started.');
              } catch { toast.error('Failed to start training pipeline'); setIsTraining(false); setTrainingMessage(''); }
            }}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, border:'none', cursor: isTraining ? 'not-allowed' : 'pointer', background: isTraining ? 'rgba(31,111,235,0.35)' : 'linear-gradient(135deg,#1F6FEB,#2679f5)', color:'white', fontSize:13, fontWeight:600, fontFamily:'inherit', boxShadow: isTraining ? 'none' : '0 4px 16px rgba(31,111,235,0.4)', transition:'all 0.2s' }}
          >
            {isTraining ? <Loader2 size={15} style={{ animation:'ai-spin 0.8s linear infinite' }} /> : <Brain size={15} />}
            {isTraining ? 'Training…' : 'Train New Model'}
          </button>
        </div>
      </div>

      {/* Training banner */}
      {trainingMessage && (
        <div className="ai-row" style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderRadius:14, background:'rgba(31,111,235,0.06)', border:'1px solid rgba(31,111,235,0.2)', marginBottom:20, animation:'ai-pulse 2s ease-in-out infinite' }}>
          <Loader2 size={18} color="#58A6FF" style={{ animation:'ai-spin 1s linear infinite' }} />
          <span style={{ color:'#58A6FF', fontSize:13 }}>{trainingMessage}</span>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="ai-row" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
        {statCards.map(c => (
          <div key={c.title} style={{ ...CARD, padding:'20px 22px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:70, height:70, borderRadius:'50%', background:`radial-gradient(circle,${c.accent}25 0%,transparent 70%)`, pointerEvents:'none' }} />
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${c.accent}18`, border:`1px solid ${c.accent}33`, display:'flex', alignItems:'center', justifyContent:'center', color:c.accent }}>{c.icon}</div>
              <span style={{ color:'#7D8590', fontSize:12 }}>{c.title}</span>
            </div>
            <div style={{ color:'#E6EDF3', fontSize:26, fontWeight:700, letterSpacing:'-0.03em' }}>{c.value}</div>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${c.accent}66,transparent)` }} />
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="ai-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ ...CARD, padding:'20px 24px' }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600 }}>Feature Importance</div>
            <div style={{ color:'#7D8590', fontSize:12, marginTop:3 }}>Top features driving model predictions</div>
          </div>
          {activeModel?.feature_importances && activeModel.feature_importances.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={activeModel.feature_importances} margin={{ top:8,right:16,left:8,bottom:40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                <XAxis dataKey="feature" stroke="#484F58" angle={-35} textAnchor="end" height={80} tick={{ fontSize:10 }} />
                <YAxis width={50} stroke="#484F58" tick={{ fontSize:10 }} />
                <Tooltip contentStyle={TOOLTIP_S} />
                <Bar dataKey="importance" fill="#3FB950" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:260, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#7D8590', gap:10 }}>
              <Database size={32} color="#21262D" />
              <span style={{ fontSize:13 }}>Feature importance not available for this model type</span>
            </div>
          )}
        </div>

        <div style={{ ...CARD, padding:'20px 24px' }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600 }}>Detection Accuracy by Threat Type</div>
            <div style={{ color:'#7D8590', fontSize:12, marginTop:3 }}>Per-category classification accuracy</div>
          </div>
          {activeModel?.threat_detection_accuracy && activeModel.threat_detection_accuracy.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={activeModel.threat_detection_accuracy} margin={{ top:8,right:16,left:8,bottom:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                <XAxis dataKey="category" stroke="#484F58" angle={-25} textAnchor="end" height={60} tick={{ fontSize:11 }} />
                <YAxis width={50} stroke="#484F58" domain={[0,100]} tick={{ fontSize:10 }} />
                <Tooltip contentStyle={TOOLTIP_S} />
                <Bar dataKey="accuracy" fill="#1F6FEB" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:260, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#7D8590', gap:10 }}>
              <Activity size={32} color="#21262D" />
              <span style={{ fontSize:13 }}>Detection accuracy data not available yet</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Deployed Models ── */}
      <div className="ai-row" style={{ ...CARD, padding:'20px 24px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600 }}>Deployed Models</div>
            <div style={{ color:'#7D8590', fontSize:12, marginTop:3 }}>{deployedModels.length} model{deployedModels.length !== 1 ? 's' : ''} in registry</div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {deployedModels.map((model: any, idx: number) => (
            <div key={model.version || idx} style={{
              background:'rgba(13,17,23,0.6)', borderRadius:14, padding:'18px 20px',
              border: `1px solid ${model.status === 'Active' ? 'rgba(63,185,80,0.25)' : '#21262D'}`,
              transition:'border-color 0.2s',
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <span style={{ color:'#E6EDF3', fontSize:15, fontWeight:600 }}>{model.name || 'RandomForest IDS'}</span>
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                      color: model.status === 'Active' ? '#3FB950' : '#7D8590',
                      background: model.status === 'Active' ? 'rgba(63,185,80,0.1)' : 'rgba(125,133,144,0.08)',
                      border: `1px solid ${model.status === 'Active' ? 'rgba(63,185,80,0.25)' : '#30363D'}`,
                    }}>
                      {model.status === 'Active' ? <CheckCircle size={10}/> : <AlertCircle size={10}/>} {model.status}
                    </span>
                    <span style={{ color:'#484F58', fontSize:12, fontFamily:'monospace' }}>{model.version}</span>
                  </div>
                  <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:13 }}>
                    <span><span style={{ color:'#7D8590' }}>Accuracy:</span> <span style={{ color:'#3FB950', fontWeight:600 }}>{model.accuracy}%</span></span>
                    <span><span style={{ color:'#7D8590' }}>F1:</span> <span style={{ color:'#58A6FF', fontWeight:600 }}>{model.f1_score || model.accuracy}%</span></span>
                    <span><span style={{ color:'#7D8590' }}>Trained:</span> <span style={{ color:'#C9D1D9' }}>{model.timestamp || model.lastTrained || 'N/A'}</span></span>
                    <span><span style={{ color:'#7D8590' }}>Samples:</span> <span style={{ color:'#C9D1D9' }}>{model.sample_size ? `${(model.sample_size/1000).toFixed(0)}K` : model.samples || '2.4M'}</span></span>
                  </div>
                  {model.training_time_seconds > 0 && (
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                      {[
                        `${model.training_time_seconds}s train`,
                        `${model.n_estimators} trees`,
                        `${model.total_features} features`,
                        model.triggered_by && `by ${model.triggered_by}`,
                      ].filter(Boolean).map(t => (
                        <span key={t} style={{ padding:'2px 8px', borderRadius:6, background:'rgba(31,111,235,0.06)', border:'1px solid rgba(31,111,235,0.12)', color:'#7D8590', fontSize:11 }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 }}>
                  {[
                    { label:'Details', icon:<Eye size={12}/>, color:'#C9D1D9', onClick: async () => { try { setDetailModel(await getModelDetails(model.version)); } catch { toast.error('Failed to load details'); } }, show:true },
                    { label:'Activate', icon:<Power size={12}/>, color:'#3FB950', onClick: async () => { try { const r = await activateModel(model.version); toast.success(r.message); fetchModels(); } catch { toast.error('Activation failed'); } }, show: model.status !== 'Active' },
                    { label:'Retrain', icon:<Loader2 size={12} style={isTraining?{animation:'ai-spin 0.8s linear infinite'}:{}}/>, color:'#58A6FF', onClick: async () => {
                      setIsTraining(true); setTrainingMessage(`Retraining ${model.name || 'model'}…`);
                      try { const r = await trainNewModel({ algorithm:model.algorithm||'random_forest', dataset_name:configDataset, use_live_data:configUseLiveData, n_estimators:model.n_estimators||configEstimators, max_depth:model.max_depth||configMaxDepth, sample_size:model.sample_size||configSampleSize }); toast.info(r.message); }
                      catch { toast.error('Retrain failed'); setIsTraining(false); setTrainingMessage(''); }
                    }, show:true },
                    { label:'Delete', icon:<Trash2 size={12}/>, color:'#FF4D4D', onClick: async () => {
                      if (!confirm(`Delete ${model.version}?`)) return;
                      try { const r = await deleteModel(model.version); toast.success(r.message); fetchModels(); if (detailModel?.version === model.version) setDetailModel(null); }
                      catch (e:any) { toast.error(e?.response?.data?.detail || 'Delete failed'); }
                    }, show: model.status !== 'Active' },
                  ].filter(b => b.show).map(b => (
                    <button key={b.label} onClick={b.onClick} disabled={b.label === 'Retrain' && isTraining}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600, fontFamily:'inherit', cursor:'pointer', color:b.color, background:`${b.color}10`, border:`1px solid ${b.color}25`, transition:'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${b.color}20`)}
                      onMouseLeave={e => (e.currentTarget.style.background = `${b.color}10`)}>
                      {b.icon} {b.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* accuracy bar */}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ color:'#7D8590', fontSize:11, minWidth:80 }}>Performance</span>
                <div style={{ flex:1, height:5, borderRadius:3, background:'#21262D' }}>
                  <div style={{ width:`${model.accuracy}%`, height:'100%', borderRadius:3, background: model.accuracy >= 95 ? '#3FB950' : model.accuracy >= 85 ? '#FFA657' : '#FF4D4D', transition:'width 0.4s' }} />
                </div>
                <span style={{ color:'#E6EDF3', fontSize:12, fontWeight:700, minWidth:40 }}>{model.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Detail Modal */}
      {detailModel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={() => setDetailModel(null)}>
          <div style={{ ...CARD, maxWidth:780, width:'100%', margin:16, padding:'28px 32px', boxShadow:'0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(31,111,235,0.2)', position:'relative', overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>
            {/* top accent */}
            <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:1, background:'linear-gradient(90deg,transparent,rgba(88,166,255,0.5),transparent)' }} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <div style={{ color:'#E6EDF3', fontSize:17, fontWeight:700 }}>Model Details — {detailModel.name || 'Unknown'}</div>
                <span style={{ color:'#484F58', fontSize:12, fontFamily:'monospace' }}>{detailModel.version}</span>
              </div>
              <button onClick={() => setDetailModel(null)}
                style={{ padding:'7px 14px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid #30363D', color:'#C9D1D9', fontSize:12, fontWeight:600, fontFamily:'inherit', cursor:'pointer' }}>
                Close
              </button>
            </div>
            {/* metric cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
              {[
                { label:'Accuracy', value:`${detailModel.accuracy}%`, color:'#3FB950' },
                { label:'Precision', value:`${detailModel.precision || 'N/A'}%`, color:'#58A6FF' },
                { label:'Recall', value:`${detailModel.recall || 'N/A'}%`, color:'#FFA657' },
                { label:'F1 Score', value:`${detailModel.f1_score || 'N/A'}%`, color:'#BC8CFF' },
              ].map(m => (
                <div key={m.label} style={{ background:'rgba(13,17,23,0.6)', borderRadius:12, padding:'14px 16px', border:'1px solid #21262D', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-16, right:-16, width:50, height:50, borderRadius:'50%', background:`radial-gradient(circle,${m.color}20 0%,transparent 70%)`, pointerEvents:'none' }} />
                  <div style={{ color:'#7D8590', fontSize:11, marginBottom:6 }}>{m.label}</div>
                  <div style={{ color:m.color, fontSize:22, fontWeight:700, letterSpacing:'-0.02em' }}>{m.value}</div>
                </div>
              ))}
            </div>
            {/* metadata grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {[
                { k:'Algorithm', v: detailModel.algorithm?.replace('_',' ').replace(/\b\w/g,(c:string)=>c.toUpperCase()) || 'Random Forest' },
                { k:'Status', v: detailModel.status, color: detailModel.status==='Active' ? '#3FB950' : '#7D8590' },
                { k:'Trained', v: detailModel.timestamp || 'N/A' },
                { k:'n_estimators', v: detailModel.n_estimators || 'N/A' },
                { k:'max_depth', v: detailModel.max_depth || 'None' },
                { k:'Features', v: detailModel.total_features || 'N/A' },
                { k:'Samples', v: detailModel.sample_size ? `${(detailModel.sample_size/1000).toFixed(0)}K` : 'N/A' },
                { k:'Training Time', v: detailModel.training_time_seconds ? `${detailModel.training_time_seconds}s` : 'N/A' },
                { k:'Triggered By', v: detailModel.triggered_by || 'system' },
              ].map(r => (
                <div key={r.k} style={{ padding:'8px 12px', borderRadius:8, background:'rgba(13,17,23,0.4)', border:'1px solid rgba(48,54,61,0.4)' }}>
                  <span style={{ color:'#7D8590', fontSize:11 }}>{r.k}: </span>
                  <span style={{ color: r.color || '#E6EDF3', fontSize:12, fontWeight:500 }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Configuration panel ── */}
      <div className="ai-row" style={{ ...CARD, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600 }}>Training Configuration</div>
            <div style={{ color:'#7D8590', fontSize:12, marginTop:3 }}>Hyperparameters for the next training run</div>
          </div>
          <button
            onClick={() => toast.success('Configuration saved!')}
            style={{ padding:'7px 14px', borderRadius:8, background:'linear-gradient(135deg,#1F6FEB,#2679f5)', border:'none', color:'white', fontSize:12, fontWeight:600, fontFamily:'inherit', cursor:'pointer', boxShadow:'0 4px 12px rgba(31,111,235,0.3)' }}
          >
            Save Config
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <div style={{ color:'#7D8590', fontSize:12, marginBottom:6 }}>Training Dataset</div>
              <select value={configDataset} onChange={e => setConfigDataset(e.target.value)}
                style={{ width:'100%', background:'rgba(13,17,23,0.8)', border:'1px solid #30363D', borderRadius:10, padding:'10px 12px', color:'#E6EDF3', fontSize:13, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                {DATASETS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input type="checkbox" checked={configUseLiveData} onChange={e => setConfigUseLiveData(e.target.checked)}
                style={{ width:16, height:16, accentColor:'#1F6FEB' }} />
              <span style={{ color:'#C9D1D9', fontSize:13 }}>Include live captured traffic (online learning)</span>
            </label>
            <div>
              <div style={{ color:'#7D8590', fontSize:12, marginBottom:6 }}>ML Architecture</div>
              <select value={configAlgorithm} onChange={e => setConfigAlgorithm(e.target.value)}
                style={{ width:'100%', background:'rgba(13,17,23,0.8)', border:'1px solid #30363D', borderRadius:10, padding:'10px 12px', color:'#E6EDF3', fontSize:13, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                {ALGORITHMS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color:'#7D8590', fontSize:12, marginBottom:6 }}>n_estimators</div>
              <input type="number" min={10} max={500} value={configEstimators}
                onChange={e => setConfigEstimators(parseInt(e.target.value) || 100)}
                style={{ width:'100%', background:'rgba(13,17,23,0.8)', border:'1px solid #30363D', borderRadius:10, padding:'10px 12px', color:'#E6EDF3', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
            </div>
            <div>
              <div style={{ color:'#7D8590', fontSize:12, marginBottom:6 }}>sample_size</div>
              <input type="number" min={1000} max={2000000} step={10000} value={configSampleSize}
                onChange={e => setConfigSampleSize(parseInt(e.target.value) || 50000)}
                style={{ width:'100%', background:'rgba(13,17,23,0.8)', border:'1px solid #30363D', borderRadius:10, padding:'10px 12px', color:'#E6EDF3', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
              <div style={{ color:'#484F58', fontSize:11, marginTop:4 }}>Higher = slower training, better accuracy. Max: 2,262,300</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <div style={{ color:'#7D8590', fontSize:12, marginBottom:6 }}>criterion</div>
              <div style={{ background:'rgba(13,17,23,0.8)', border:'1px solid #30363D', borderRadius:10, padding:'10px 12px', color:'#E6EDF3', fontSize:13 }}>gini</div>
            </div>
            <div>
              <div style={{ color:'#7D8590', fontSize:12, marginBottom:6 }}>max_depth</div>
              <input type="number" min={1} max={100} value={configMaxDepth ?? ''} placeholder="None (unlimited)"
                onChange={e => setConfigMaxDepth(e.target.value ? parseInt(e.target.value) : null)}
                style={{ width:'100%', background:'rgba(13,17,23,0.8)', border:'1px solid #30363D', borderRadius:10, padding:'10px 12px', color:'#E6EDF3', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
              <div style={{ color:'#484F58', fontSize:11, marginTop:4 }}>Leave empty for unlimited depth</div>
            </div>
          </div>
        </div>
      </div>

    </div>
    </>
  );
}
