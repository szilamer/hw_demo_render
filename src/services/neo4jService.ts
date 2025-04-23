import neo4j, { Driver, Session } from 'neo4j-driver';

class Neo4jService {
  private driver: Driver | null = null;
  private uri: string = 'neo4j://n8ndev.hwnet.local:7620';  // Szerver URI
  private user: string = 'neo4j';                           // Felhasználónév
  private password: string = 'HenOrat499';                  // Jelszó

  async connect(uri?: string, user?: string, password?: string): Promise<boolean> {
    try {
      this.uri = uri || this.uri;
      this.user = user || this.user;
      this.password = password || this.password;

      console.log('Kapcsolódás a Neo4j szerverhez:', this.uri);
      
      this.driver = neo4j.driver(
        this.uri,
        neo4j.auth.basic(this.user, this.password),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 óra
          maxConnectionPoolSize: 50,
          connectionTimeout: 30000, // 30 másodperc
        }
      );

      // Teszteljük a kapcsolatot
      await this.driver.verifyConnectivity();
      console.log('Sikeres kapcsolódás a Neo4j adatbázishoz');
      return true;
    } catch (error) {
      console.error('Hiba a Neo4j kapcsolódás során:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.driver) {
      console.error('Nincs aktív Neo4j kapcsolat');
      return false;
    }

    try {
      await this.driver.verifyConnectivity();
      return true;
    } catch (error) {
      console.error('Hiba a Neo4j kapcsolat tesztelése során:', error);
      return false;
    }
  }

  async executeQuery(query: string, params: Record<string, any> = {}): Promise<any[]> {
    if (!this.driver) {
      throw new Error('Nincs aktív Neo4j kapcsolat');
    }

    const session: Session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }

  // Betegség gráf specifikus metódusok
  async importPatientData(nodes: any[], relationships: any[]): Promise<void> {
    // Nodes importálása
    for (const node of nodes) {
      const query = `
        CREATE (n:${node.type} {
          id: $id,
          label: $label,
          timestamp: $timestamp
        })
      `;
      await this.executeQuery(query, {
        id: node.id,
        label: node.label,
        timestamp: node.timestamp ? node.timestamp.toISOString() : null
      });
    }

    // Relationships importálása
    for (const rel of relationships) {
      const query = `
        MATCH (from) WHERE from.id = $fromId
        MATCH (to) WHERE to.id = $toId
        CREATE (from)-[r:RELATES_TO { label: $label }]->(to)
      `;
      await this.executeQuery(query, {
        fromId: rel.from,
        toId: rel.to,
        label: rel.label || ''
      });
    }
  }

  async getVisibleNodes(startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      MATCH (n)
      WHERE (n:event AND n.timestamp >= $startDate AND n.timestamp <= $endDate)
         OR (n:disease AND EXISTS {
           MATCH (n)-[]-(e:event)
           WHERE e.timestamp >= $startDate AND e.timestamp <= $endDate
         })
      RETURN n
    `;
    return this.executeQuery(query, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  }
}

export const neo4jService = new Neo4jService(); 