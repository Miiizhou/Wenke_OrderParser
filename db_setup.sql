USE WenkeOrders;
GO

-- Create the table to store order history if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ParsingHistory' AND xtype='U')
BEGIN
    CREATE TABLE ParsingHistory (
        Id NVARCHAR(50) PRIMARY KEY, -- Stores the UUID
        Timestamp BIGINT NOT NULL,   -- Stores the JS timestamp
        RawOrderCount INT DEFAULT 0, -- For quick querying stats
        ProcessedRowCount INT DEFAULT 0,
        JsonData NVARCHAR(MAX) NOT NULL -- Stores the full ParsingResult JSON object
    );
END
GO

-- Optional: Create an index on Timestamp for faster sorting
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ParsingHistory_Timestamp')
BEGIN
    CREATE NONCLUSTERED INDEX IX_ParsingHistory_Timestamp ON ParsingHistory(Timestamp DESC);
END
GO