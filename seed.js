const bcrypt = require('bcryptjs');
const db = require('./database');

async function seed() {
  await db.init();
  console.log('Seeding database...');
  const hash = await bcrypt.hash('password123', 10);

  // Admin
  db.prepare('INSERT OR IGNORE INTO users (name,email,password,role,phone,status) VALUES (?,?,?,?,?,?)')
    .run('Admin User','admin@tutoring.com',hash,'admin','+1234567890','active');

  // Teachers
  const teachers = [
    ['Sarah Johnson','sarah@tutoring.com','+1111111111','Passionate math teacher with 8 years experience.',35,8,'["Mathematics","Algebra","Calculus"]','New York','M.Sc Mathematics'],
    ['James Wilson','james@tutoring.com','+2222222222','Physics enthusiast and experienced tutor.',40,10,'["Physics","Chemistry","Science"]','Boston','Ph.D Physics'],
    ['Emily Chen','emily@tutoring.com','+3333333333','Expert English tutor specializing in essay writing.',30,6,'["English","Literature","Writing"]','San Francisco','M.A English'],
    ['Michael Brown','michael@tutoring.com','+4444444444','CS tutor with industry experience.',45,12,'["Programming","Python","JavaScript"]','Seattle','M.Sc Computer Science'],
    ['Lisa Park','lisa@tutoring.com','+5555555555','Biology tutor focused on accessibility.',28,5,'["Biology","Chemistry","Science"]','Chicago','M.Sc Biology']
  ];

  for (const t of teachers) {
    const r = db.prepare('INSERT OR IGNORE INTO users (name,email,password,role,phone,status) VALUES (?,?,?,?,?,?)')
      .run(t[0],t[1],hash,'teacher',t[2],'active');
    if (r.changes > 0) {
      db.prepare('INSERT OR IGNORE INTO teacher_profiles (user_id,bio,hourly_rate,experience_years,subjects,location,education,status,rating,total_reviews,total_students) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
        .run(r.lastInsertRowid,t[3],t[4],t[5],t[6],t[7],t[8],'approved',(4+Math.random()).toFixed(1),Math.floor(Math.random()*20)+5,Math.floor(Math.random()*30)+10);
    }
  }

  // Students
  const students = [['Alex Student','alex@student.com','+6666666666'],['Maria Garcia','maria@student.com','+7777777777']];
  for (const s of students) {
    db.prepare('INSERT OR IGNORE INTO users (name,email,password,role,phone,status) VALUES (?,?,?,?,?,?)').run(s[0],s[1],hash,'student',s[2],'active');
  }

  db.save();
  console.log('Database seeded!');
  console.log('Credentials (password: password123):');
  console.log('  Admin:   admin@tutoring.com');
  console.log('  Teacher: sarah@tutoring.com');
  console.log('  Student: alex@student.com');
}

seed().catch(console.error);
