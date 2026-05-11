/* 
   SQL Script for Creating the Component Details Database and Table in SSMS 
*/

-- Create the Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ComponentDB')
BEGIN
    CREATE DATABASE ComponentDB;
END
GO

USE ComponentDB;
GO

-- Create the ComponentDetails Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ComponentDetails]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ComponentDetails] (
        [Id] [int] IDENTITY(1,1) PRIMARY KEY,
        [DrawingId] [nvarchar](100) NULL,
        [LineId] [nvarchar](100) NULL,
        [RevNo] [nvarchar](50) NULL,
        [SpoolNo] [nvarchar](100) NULL,
        [Item] [nvarchar](100) NULL,
        [ItemCode] [nvarchar](100) NULL,
        [Description] [nvarchar](MAX) NULL,
        [Size_Inch] [decimal](18, 4) NULL,
        [MFA] [nvarchar](100) NULL,
        [SMIV] [nvarchar](100) NULL,
        [HMIV] [nvarchar](100) NULL,
        [SubContractor] [nvarchar](100) NULL,
        [IsMIVLinesIssuance] [bit] NULL,
        [ComponentStatus] [nvarchar](100) NULL,
        [InsuType] [nvarchar](100) NULL,
        [InsuThickness] [decimal](18, 2) NULL,
        [InsuLength] [decimal](18, 2) NULL,
        [RussianDescription] [nvarchar](MAX) NULL,
        [Specification] [nvarchar](100) NULL,
        [Length_InchMeter] [decimal](18, 4) NULL,
        [ComponentWeight] [decimal](18, 4) NULL,
        [ComponentSurfaceArea] [decimal](18, 4) NULL,
        [PaintSystem] [nvarchar](100) NULL,
        [UniqueComponentIdentifier] [nvarchar](100) NULL,
        [ErectionDrawingNo] [nvarchar](100) NULL,
        [UId] [uniqueidentifier] DEFAULT NEWID(),
        [Quantity] [decimal](18, 4) NULL,
        [Length] [decimal](18, 4) NULL,
        [Part_No] [nvarchar](100) NULL,
        [Description_Language] [nvarchar](100) NULL,
        [SheetNo] [nvarchar](50) NULL,
        [CreatedAt] [datetime] DEFAULT GETDATE()
    );
END
GO

-- Create Index for common search fields
CREATE INDEX IX_DrawingId ON [dbo].[ComponentDetails] (DrawingId);
CREATE INDEX IX_LineId ON [dbo].[ComponentDetails] (LineId);
GO
