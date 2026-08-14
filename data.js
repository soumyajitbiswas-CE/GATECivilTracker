const defaultState = {
    settings: {
        theme: 'dark'
    },
    studyHistory: [],
    mocksHistory: [],
    pyqs: {
        'general_aptitude': { solved: 0, total: 100 },
        'engineering_mathematics': { solved: 0, total: 120 },
        'structural_engineering': { solved: 0, total: 200 },
        'geotechnical_engineering': { solved: 0, total: 200 },
        'water_resources_engineering': { solved: 0, total: 150 },
        'environmental_engineering': { solved: 0, total: 150 },
        'transportation_engineering': { solved: 0, total: 150 },
        'geomatics_engineering': { solved: 0, total: 80 },
        'construction_materials': { solved: 0, total: 80 }
    },
    tests: {
        topic: { completed: 0, total: 40 },
        subject: { completed: 0, total: 10 }
    },
    mocks: {
        completed: 0, total: 20
    },
    revision: {
        '1st': 0,
        '2nd': 0,
        'final': 0,
        total: 9
    },
    subjects: [
        {
            id: 'general_aptitude',
            name: 'General Aptitude',
            trackerWeight: 15,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-brain"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/></svg>`,
            topics: [
                { id: 'ga_1', name: 'Verbal Aptitude', trackerWeight: 2.5, completed: false },
                { id: 'ga_2', name: 'Basic English Grammar', trackerWeight: 2.5, completed: false },
                { id: 'ga_3', name: 'Reading Comprehension', trackerWeight: 2.5, completed: false },
                { id: 'ga_4', name: 'Numerical Computation', trackerWeight: 2.5, completed: false },
                { id: 'ga_5', name: 'Data Interpretation', trackerWeight: 2.5, completed: false },
                { id: 'ga_6', name: 'Logic and Spatial Aptitude', trackerWeight: 2.5, completed: false }
            ]
        },
        {
            id: 'engineering_mathematics',
            name: 'Engineering Mathematics',
            trackerWeight: 13,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calculator"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>`,
            topics: [
                { id: 'em_1', name: 'Linear Algebra', trackerWeight: 2.2, completed: false },
                { id: 'em_2', name: 'Calculus', trackerWeight: 2.2, completed: false },
                { id: 'em_3', name: 'Ordinary Differential Equations', trackerWeight: 2.2, completed: false },
                { id: 'em_4', name: 'Partial Differential Equations', trackerWeight: 2.1, completed: false },
                { id: 'em_5', name: 'Probability and Statistics', trackerWeight: 2.2, completed: false },
                { id: 'em_6', name: 'Numerical Methods', trackerWeight: 2.1, completed: false }
            ]
        },
        {
            id: 'structural_engineering',
            name: 'Structural Engineering',
            trackerWeight: 12,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
            topics: [
                { id: 'se_1', name: 'Engineering Mechanics', trackerWeight: 1.0, completed: false },
                { id: 'se_2', name: 'Strength of Materials (Stress-strain, Bending, Deflection)', trackerWeight: 3.0, completed: false },
                { id: 'se_3', name: 'Structural Analysis (Influence lines, Slope-deflection, Moment-distribution)', trackerWeight: 3.0, completed: false },
                { id: 'se_4', name: 'Construction Materials', trackerWeight: 1.0, completed: false },
                { id: 'se_5', name: 'Concrete Structures (Limit-state design)', trackerWeight: 2.0, completed: false },
                { id: 'se_6', name: 'Steel Structures (Tension, Compression, Flexural, Connections)', trackerWeight: 2.0, completed: false }
            ]
        },
        {
            id: 'geotechnical_engineering',
            name: 'Geotechnical Engineering',
            trackerWeight: 15,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>`,
            topics: [
                { id: 'ge_1', name: 'Soil Properties and Classification', trackerWeight: 1.5, completed: false },
                { id: 'ge_2', name: 'Three-Phase System', trackerWeight: 1.0, completed: false },
                { id: 'ge_3', name: 'Index Properties', trackerWeight: 1.0, completed: false },
                { id: 'ge_4', name: 'Permeability and Seepage', trackerWeight: 1.5, completed: false },
                { id: 'ge_5', name: 'Effective Stress', trackerWeight: 1.0, completed: false },
                { id: 'ge_6', name: 'Compaction', trackerWeight: 1.0, completed: false },
                { id: 'ge_7', name: 'Consolidation', trackerWeight: 2.0, completed: false },
                { id: 'ge_8', name: 'Shear Strength', trackerWeight: 2.0, completed: false },
                { id: 'ge_9', name: 'Earth Pressure', trackerWeight: 1.5, completed: false },
                { id: 'ge_10', name: 'Bearing Capacity', trackerWeight: 1.0, completed: false },
                { id: 'ge_11', name: 'Slope Stability', trackerWeight: 0.5, completed: false },
                { id: 'ge_12', name: 'Subsurface Exploration & Foundations', trackerWeight: 1.0, completed: false }
            ]
        },
        {
            id: 'water_resources_engineering',
            name: 'Water Resources Engineering',
            trackerWeight: 11,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-droplet"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`,
            topics: [
                { id: 'wr_1', name: 'Fluid Properties and Fluid Statics', trackerWeight: 1.0, completed: false },
                { id: 'wr_2', name: 'Fluid Kinematics and Dynamics', trackerWeight: 1.5, completed: false },
                { id: 'wr_3', name: 'Flow Through Pipes', trackerWeight: 1.0, completed: false },
                { id: 'wr_4', name: 'Open-Channel Flow', trackerWeight: 2.0, completed: false },
                { id: 'wr_5', name: 'Hydraulic Machines', trackerWeight: 1.0, completed: false },
                { id: 'wr_6', name: 'Hydrology', trackerWeight: 1.5, completed: false },
                { id: 'wr_7', name: 'Irrigation Engineering', trackerWeight: 1.0, completed: false },
                { id: 'wr_8', name: 'Groundwater', trackerWeight: 0.5, completed: false },
                { id: 'wr_9', name: 'Reservoirs and Dams', trackerWeight: 0.5, completed: false },
                { id: 'wr_10', name: 'Water Requirement of Crops', trackerWeight: 1.0, completed: false }
            ]
        },
        {
            id: 'environmental_engineering',
            name: 'Environmental Engineering',
            trackerWeight: 11,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-leaf"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
            topics: [
                { id: 'ee_1', name: 'Water Quality', trackerWeight: 1.0, completed: false },
                { id: 'ee_2', name: 'Water Treatment (Physical, Chemical, Biological)', trackerWeight: 2.5, completed: false },
                { id: 'ee_3', name: 'Water Distribution Systems', trackerWeight: 0.5, completed: false },
                { id: 'ee_4', name: 'Sewerage Systems', trackerWeight: 1.0, completed: false },
                { id: 'ee_5', name: 'Wastewater Treatment', trackerWeight: 3.0, completed: false },
                { id: 'ee_6', name: 'Air Pollution', trackerWeight: 1.0, completed: false },
                { id: 'ee_7', name: 'Solid Waste Management', trackerWeight: 1.0, completed: false },
                { id: 'ee_8', name: 'Environmental Impact Assessment', trackerWeight: 1.0, completed: false }
            ]
        },
        {
            id: 'transportation_engineering',
            name: 'Transportation Engineering',
            trackerWeight: 11,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
            topics: [
                { id: 'te_1', name: 'Highway Engineering', trackerWeight: 1.0, completed: false },
                { id: 'te_2', name: 'Geometric Design', trackerWeight: 3.0, completed: false },
                { id: 'te_3', name: 'Pavement Materials', trackerWeight: 1.5, completed: false },
                { id: 'te_4', name: 'Flexible Pavement Design', trackerWeight: 1.0, completed: false },
                { id: 'te_5', name: 'Rigid Pavement Design', trackerWeight: 1.0, completed: false },
                { id: 'te_6', name: 'Traffic Engineering (Flow, Capacity)', trackerWeight: 2.5, completed: false },
                { id: 'te_7', name: 'Railway Engineering', trackerWeight: 0.5, completed: false },
                { id: 'te_8', name: 'Airport Engineering', trackerWeight: 0.5, completed: false }
            ]
        },
        {
            id: 'geomatics_engineering',
            name: 'Geomatics Engineering',
            trackerWeight: 6,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
            topics: [
                { id: 'gm_1', name: 'Surveying (Levelling, Traversing)', trackerWeight: 2.0, completed: false },
                { id: 'gm_2', name: 'Theodolite Surveying', trackerWeight: 1.0, completed: false },
                { id: 'gm_3', name: 'Total Station Surveying', trackerWeight: 0.5, completed: false },
                { id: 'gm_4', name: 'Photogrammetry', trackerWeight: 1.0, completed: false },
                { id: 'gm_5', name: 'Remote Sensing & GIS', trackerWeight: 1.0, completed: false },
                { id: 'gm_6', name: 'GPS & Satellite-Based Positioning', trackerWeight: 0.5, completed: false }
            ]
        },
        {
            id: 'construction_materials',
            name: 'Construction Materials and Management',
            trackerWeight: 6,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hard-hat"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6h0"/><path d="M14 6h0a6 6 0 0 1 6 6v3"/></svg>`,
            topics: [
                { id: 'cm_1', name: 'Cement & Concrete', trackerWeight: 1.5, completed: false },
                { id: 'cm_2', name: 'Aggregates, Bricks, Masonry, Timber, Bitumen', trackerWeight: 1.5, completed: false },
                { id: 'cm_3', name: 'Construction Planning', trackerWeight: 0.5, completed: false },
                { id: 'cm_4', name: 'Network Analysis (CPM, PERT)', trackerWeight: 1.0, completed: false },
                { id: 'cm_5', name: 'Cost Estimation & Project Scheduling', trackerWeight: 0.5, completed: false },
                { id: 'cm_6', name: 'Contract, Quality, Safety Management', trackerWeight: 1.0, completed: false }
            ]
        }
    ]
};
