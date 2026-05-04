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
    ['Amina Benali','amina@tutoring.dz','+213555000111','Passionate math teacher with 8 years experience.',1500,8,'["Mathematics","Algebra","Calculus"]','Algiers','M.Sc Mathematics'],
    ['Karim Mansouri','karim@tutoring.dz','+213666000222','Physics enthusiast and experienced tutor.',2000,10,'["Physics","Chemistry","Science"]','Oran','Ph.D Physics'],
    ['Yasmine Kaddour','yasmine@tutoring.dz','+213777000333','Expert English and French tutor specializing in essay writing.',1200,6,'["English","French","Writing"]','Constantine','M.A Languages'],
    ['Tarek Brahimi','tarek@tutoring.dz','+213555000444','CS tutor with industry experience.',2500,12,'["Programming","Python","JavaScript"]','Annaba','M.Sc Computer Science'],
    ['Lina Touati','lina@tutoring.dz','+213666000555','Biology tutor focused on accessibility.',1400,5,'["Biology","Science"]','Sétif','M.Sc Biology']
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
  const students = [['Amir Student','amir@student.dz','+213555123456'],['Rania Belaid','rania@student.dz','+213666987654']];
  for (const s of students) {
    db.prepare('INSERT OR IGNORE INTO users (name,email,password,role,phone,status) VALUES (?,?,?,?,?,?)').run(s[0],s[1],hash,'student',s[2],'active');
  }

  db.save();
  console.log('Database seeded!');
  console.log('Credentials (password: password123):');
  console.log('  Admin:   admin@tutoring.com');
  console.log('  Teacher: amina@tutoring.dz');
  console.log('  Student: amir@student.dz');
}

seed().catch(console.error);
