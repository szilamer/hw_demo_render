const neo4j = require('neo4j-driver');

async function checkDatabase() {
    const driver = neo4j.driver(
        'neo4j://n8ndev.hwnet.local:7620',
        neo4j.auth.basic('neo4j', 'HenOrat499')
    );

    try {
        const session = driver.session();
        
        // Csomópontok lekérdezése típusonként
        const nodesResult = await session.run('MATCH (n) RETURN DISTINCT labels(n) as type, count(*) as count');
        console.log('\nCsomópontok típusonként:');
        nodesResult.records.forEach(record => {
            console.log(`${record.get('type')}: ${record.get('count')} db`);
        });

        // Kapcsolatok lekérdezése típusonként
        const relsResult = await session.run('MATCH ()-[r]->() RETURN DISTINCT type(r) as type, count(*) as count');
        console.log('\nKapcsolatok típusonként:');
        relsResult.records.forEach(record => {
            console.log(`${record.get('type')}: ${record.get('count')} db`);
        });

        // Minta adatok lekérdezése (első 5 csomópont)
        const sampleResult = await session.run('MATCH (n) RETURN n LIMIT 5');
        console.log('\nMinta adatok (első 5 csomópont):');
        sampleResult.records.forEach(record => {
            const node = record.get('n');
            console.log(node.properties);
        });

        await session.close();
        await driver.close();
    } catch (error) {
        console.error('Hiba történt:', error);
    }
}

checkDatabase(); 