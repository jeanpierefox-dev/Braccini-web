const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Add where and limit to imports
content = content.replace('  serverTimestamp', '  serverTimestamp,\n  where,\n  limit');
content = content.replace('import { UserProfile', 'import { UserProfile');

// Fix player count query
const playerQueryOld = `    const qPlayers = collection(db, 'players');
    const unsubscribe = onSnapshot(qPlayers, (snapshot) => {`;
const playerQueryNew = `    const qPlayers = query(collection(db, 'users'), where('clubRole', '==', 'jugador'));
    const unsubscribe = onSnapshot(qPlayers, (snapshot) => {`;
content = content.replace(playerQueryOld, playerQueryNew);

// Add director profile state and query
const stateOld = `  const [registeredPlayersCount, setRegisteredPlayersCount] = useState<number | null>(null);`;
const stateNew = `  const [registeredPlayersCount, setRegisteredPlayersCount] = useState<number | null>(null);
  const [directorProfile, setDirectorProfile] = useState<UserProfile | null>(null);`;
content = content.replace(stateOld, stateNew);

const queryOld = `  // Listen to total comments per publication`;
const queryNew = `  useEffect(() => {
    const qDirector = query(collection(db, 'users'), where('clubRole', '==', 'director'), limit(1));
    const unsubscribe = onSnapshot(qDirector, (snapshot) => {
      if (!snapshot.empty) {
        setDirectorProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile);
      } else {
        setDirectorProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to total comments per publication`;
content = content.replace(queryOld, queryNew);

fs.writeFileSync('src/pages/Home.tsx', content);
console.log('Done');
