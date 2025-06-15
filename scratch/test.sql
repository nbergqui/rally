
select * from RallyBonuses;
select * from RallyBonuses where Leg = 1 order by Ordinal;

update RallyBonuses set Leg = 103
  where Leg = 3;

update RallyBonuses set LayoverMinutes = 0
    where BonusID = 165





select * from RallyLeg;

update RallyLeg set CheckpointTime = '2025-06-19 21:00:00.000', StartTime = '2025-06-16 17:00:00.000'
where Leg = 1;

update RallyLeg set CheckpointTime = '2025-06-22 21:00:00.000', StartTime = '2025-06-20 11:00:00.000'
where Leg = 2;

update RallyLeg set CheckpointTime = '2025-06-27 11:00:00.000', StartTime = '2025-06-23 11:00:00.000'
where Leg = 3;


select * from dbo.RallyDirectionsCache;
-- delete from dbo.RallyDirectionsCache







-- 41.68809840021987, -91.5655715745044

INSERT INTO [dbo].[RallyBonuses] (
    [BonusCode], [Points], [BonusName],
    [Latitude], [Longitude], [AvailableHours], [Description],
    [Leg], [Ordinal], [Include], [Visited], [LayoverMinutes]
) VALUES (
    'CVST1', 0, 'Coralville Start', 
    41.6880, -91.5655, NULL, 'Start Leg 1',
    1, 1, 1, 0, 0
);
INSERT INTO [dbo].[RallyBonuses] (
    [BonusCode], [Points], [BonusName],
    [Latitude], [Longitude], [AvailableHours], [Description],
    [Leg], [Ordinal], [Include], [Visited], [LayoverMinutes]
) VALUES (
    'CVEN1', 0, 'Coralville End', 
    41.6880, -91.5655, NULL, 'End Leg 1',
    1, 999, 1, 0, 0
);



INSERT INTO [dbo].[RallyBonuses] (
    [BonusCode], [Points], [BonusName],
    [Latitude], [Longitude], [AvailableHours], [Description],
    [Leg], [Ordinal], [Include], [Visited], [LayoverMinutes]
) VALUES (
    'CVST2', 0, 'Coralville Start', 
    41.6880, -91.5655, NULL, 'Start Leg 2',
    2, 1, 1, 0, 0
);
INSERT INTO [dbo].[RallyBonuses] (
    [BonusCode], [Points], [BonusName],
    [Latitude], [Longitude], [AvailableHours], [Description],
    [Leg], [Ordinal], [Include], [Visited], [LayoverMinutes]
) VALUES (
    'CVEN2', 0, 'Coralville End', 
    41.6880, -91.5655, NULL, 'End Leg 2',
    2, 999, 1, 0, 0
);


INSERT INTO [dbo].[RallyBonuses] (
    [BonusCode], [Points], [BonusName],
    [Latitude], [Longitude], [AvailableHours], [Description],
    [Leg], [Ordinal], [Include], [Visited], [LayoverMinutes]
) VALUES (
    'CVST3', 0, 'Coralville Start', 
    41.6880, -91.5655, NULL, 'Start Leg 3',
    3, 1, 1, 0, 0
);
INSERT INTO [dbo].[RallyBonuses] (
    [BonusCode], [Points], [BonusName],
    [Latitude], [Longitude], [AvailableHours], [Description],
    [Leg], [Ordinal], [Include], [Visited], [LayoverMinutes]
) VALUES (
    'CVEN3', 0, 'Coralville End', 
    41.6880, -91.5655, NULL, 'End Leg 3',
    3, 999, 1, 0, 0
);