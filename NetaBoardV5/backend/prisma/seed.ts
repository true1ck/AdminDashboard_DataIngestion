import { PrismaClient } from '@prisma/client';
// @ts-ignore
const { ARC, FEEDBACK, SOCIAL_FEED, ALERTS, CHANNELS } = require('./data.js');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding pipeline...');

    // 1. Clear existing data (optional, but good for idempotent seeding)
    // Cascade delete handles relationships
    await prisma.archetype.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.socialItem.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.channel.deleteMany();

    console.log('🧹 Old data wiped.');

    // -------------------------------------------------------------------
    // 2. Seed Archetypes (Leaders), Constituencies, Pillars, Sansad, Rivals
    // -------------------------------------------------------------------
    console.log('👤 Seeding Archetypes...');
    for (const [key, rawArch] of Object.entries(ARC)) {
        // Note: We cast rawArch to any because strict types from the frontend 
        // might clash with Prisma's auto-generation, but the shape is identical.
        const arch: any = rawArch;

        // Create the core archetype and all its nested 1-to-1 relationships in one massive query
        const createdArch = await prisma.archetype.create({
            data: {
                archetypeKey: key,
                name: arch.n,
                icon: arch.ic,
                tagline: arch.tg,
                primaryColor: arch.pr,
                kpis: JSON.stringify(arch.kpi || {}),

                constituency: {
                    create: {
                        name: arch.cn.const,
                        party: arch.cn.party,
                        state: arch.cn.state,
                        type: arch.cn.type || 'LS',
                        electionDate: arch.cn.eldt,
                        totalBooths: arch.cn.booth,
                    }
                },

                pillarScores: {
                    create: {
                        electoralStrength: arch.dm.es,
                        legislativePerformance: arch.dm.lp,
                        constituencyDevelopment: arch.dm.cd,
                        publicAccessibility: arch.dm.pa,
                        communication: arch.dm.cc,
                        partyStanding: arch.dm.ps,
                        mediaCoverage: arch.dm.mc,
                        digitalInfluence: arch.dm.di,
                        financialMuscle: arch.dm.fm,
                        allianceIntel: arch.dm.ai,
                        casteEquation: arch.dm.ce,
                        antiIncumbency: arch.dm.ac,
                        grassrootsNetwork: arch.dm.gn,
                        ideologyConsistency: arch.dm.ic,
                        scandalIndex: arch.dm.sc,
                    }
                },

                sansadRecord: {
                    create: {
                        attendancePercentage: arch.san.att,
                        questionsAsked: arch.san.ques,
                        privateBills: arch.san.pvt || 0,
                        billsPassed: arch.san.bill || 0,
                    }
                }
            }
        });

        // Create 1-to-Many Rival Relationships
        if (arch.rv && arch.rv.length > 0) {
            await prisma.rival.createMany({
                data: arch.rv.map((r: any) => ({
                    name: r.n,
                    nriScore: r.nri,
                    trend: r.tr || 0
                }))
            });
        }
    }

    // -------------------------------------------------------------------
    // 3. Seed Feedback
    // -------------------------------------------------------------------
    console.log('📡 Seeding Jan Darbar / Feedback items...');
    const feedbackData = FEEDBACK.map((f: any) => ({
        text: f.text,
        source: f.src,
        sentiment: f.snt,
        emotion: f.em,
        pillarId: f.pil,
        urgency: f.urg,
        // Using current timestamp instead of strings like "12m ago" for DB
        timestamp: new Date(Date.now() - Math.random() * 86400000)
    }));
    await prisma.feedback.createMany({ data: feedbackData });

    // -------------------------------------------------------------------
    // 4. Seed Social Feed
    // -------------------------------------------------------------------
    console.log('📱 Seeding Social Inbox items...');
    const socialData = SOCIAL_FEED.map((s: any) => ({
        platform: s.pl,
        author: s.au,
        text: s.tx,
        sentiment: s.snt,
        emotion: s.em,
        likes: s.lk || 0,
        reposts: s.re || 0,
        timestamp: new Date(Date.now() - Math.random() * 86400000)
    }));
    await prisma.socialItem.createMany({ data: socialData });

    // -------------------------------------------------------------------
    // 5. Seed Alerts / Crisis Items
    // -------------------------------------------------------------------
    console.log('⚡ Seeding Alerts & Crisis Items...');
    const alertData = ALERTS.map((a: any) => ({
        severity: a.sv,
        title: a.t,
        description: a.ds,
        aiSuggestedText: a.ai_txt,
        aiConfidence: a.cf,
        icon: a.ic || '⚠️',
        timestamp: new Date(Date.now() - Math.random() * 10000000)
    }));
    await prisma.alert.createMany({ data: alertData });

    // -------------------------------------------------------------------
    // 6. Seed Channels & Channel Instances
    // -------------------------------------------------------------------
    console.log('🔗 Seeding Channels and Integrations...');
    for (const ch of CHANNELS) {
        const createdChannel = await prisma.channel.create({
            data: {
                channelType: ch.id,
                name: ch.nm,
                icon: ch.ic,
                status: ch.st,
                apiEndpoint: ch.api,
                authMethod: ch.auth,
                canRead: ch.can.read === 1,
                canReply: ch.can.reply === 1,
                canDelete: ch.can.del === 1,
                canDM: ch.can.dm === 1,
                hasWebhook: ch.can.wh === 1,
            }
        });

        if (ch.instances && ch.instances.length > 0) {
            await prisma.channelInstance.createMany({
                data: ch.instances.map((inst: any) => ({
                    channelId: createdChannel.id,
                    label: inst.label,
                    handle: inst.hd,
                    status: inst.st,
                    notes: inst.notes || '',
                    followers: parseInt(inst.stats.fol.replace(/K/g, '000').replace(/Grp/g, '')) || 0,
                    totalItems: inst.stats.items,
                    pending: inst.stats.pend,
                    responsePct: inst.stats.resp || 0,
                }))
            });
        }
    }

    console.log('✅ Seeding Complete! Database is packed with your frontend NetaBoard stats.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
