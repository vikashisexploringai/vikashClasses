<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Super Admin - vikashClasses</title>
    <style>
        * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
        body { background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        .card { background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        
        /* Top Bar */
        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
        }
        .logo {
            font-size: 24px;
            font-weight: 600;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .logout-btn { 
            background: #ef4444; 
            color: white; 
            padding: 8px 20px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: 500; 
        }
        .logout-btn:hover { background: #dc2626; }
        
        /* Ribbon Header - Centered */
        .ribbon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            margin-bottom: 24px;
            text-align: center;
            position: relative;
        }
        .ribbon-with-back {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .ribbon-back {
            background: none;
            border: none;
            color: white;
            font-size: 28px;
            cursor: pointer;
            padding: 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            transition: background 0.2s;
        }
        .ribbon-back:hover {
            background: rgba(255,255,255,0.2);
        }
        .ribbon h1, .ribbon h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        }
        
        .teacher-card, .class-card, .student-card { 
            border: 1px solid #e2e8f0; 
            padding: 16px; 
            margin-bottom: 12px; 
            border-radius: 12px; 
            cursor: pointer; 
            transition: all 0.2s; 
        }
        .teacher-card:hover, .class-card:hover, .student-card:hover { 
            background: #f8fafc; 
            transform: translateX(4px); 
        }
        .teacher-code { 
            font-family: monospace; 
            background: #f1f5f9; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
        }
        .loading { text-align: center; padding: 40px; color: #666; }
        .error { color: #ef4444; background: #fee; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
        h2 { margin-top: 0; margin-bottom: 16px; font-size: 18px; }
        h3 { margin: 0 0 8px 0; font-size: 16px; }
        .stats { display: flex; gap: 16px; margin-top: 8px; font-size: 13px; color: #64748b; }
        .progress-preview { font-size: 12px; color: #3b82f6; margin-top: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Top Bar with Logo and Logout -->
        <div class="top-bar">
            <div class="logo">📚 Vikash Classes</div>
            <button id="logoutBtn" class="logout-btn" style="display: none;">🚪 Logout</button>
        </div>
        
        <div id="authSection" class="card">
            <h2>🔐 Admin Access Required</h2>
            <p>Sign in with your Google account to access the dashboard.</p>
            <button id="googleLoginBtn" class="logout-btn" style="background: #3b82f6;">Sign in with Google</button>
        </div>
        
        <div id="adminPanel" style="display: none;">
            <!-- Main View: Teachers List -->
            <div id="teachersView">
                <div class="ribbon">
                    <h1>👩‍🏫 Teachers</h1>
                </div>
                <div id="teachersList">Loading...</div>
            </div>
            
            <!-- Teacher Detail View (hidden by default) -->
            <div id="teacherDetailView" style="display: none;">
                <div class="ribbon ribbon-with-back">
                    <button id="backToTeachersBtn" class="ribbon-back">‹</button>
                    <h2 id="teacherName">Teacher</h2>
                </div>
                <div id="teacherDetailContent"></div>
            </div>
            
            <!-- Class Detail View (hidden by default) -->
            <div id="classDetailView" style="display: none;">
                <div class="ribbon ribbon-with-back">
                    <button id="backToTeacherBtn" class="ribbon-back">‹</button>
                    <h2 id="className">Class</h2>
                </div>
                <div id="classDetailContent"></div>
            </div>
            
            <!-- Student Detail View (hidden by default) -->
            <div id="studentDetailView" style="display: none;">
                <div class="ribbon ribbon-with-back">
                    <button id="backToClassBtn" class="ribbon-back">‹</button>
                    <h2 id="studentName">Student</h2>
                </div>
                <div id="studentDetailContent"></div>
            </div>
        </div>
    </div>

    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    
    <script type="module" src="admin.js"></script>
</body>
</html>