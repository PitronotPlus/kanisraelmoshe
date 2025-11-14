
export default function TableRenderer({ tableData }) {
  if (!tableData || !tableData.data) {
    return <p className="text-red-500">[טבלה לא נמצאה]</p>;
  }

  const { data, headers } = tableData;

  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse border border-gray-300">
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => {
                const TagName = headers[rowIndex] ? 'th' : 'td';
                return (
                  <TagName
                    key={colIndex}
                    className={`border border-gray-300 p-3 text-right ${
                      headers[rowIndex] ? 'font-bold bg-gray-100' : ''
                    }`}
                    style={{ color: cell?.textColor || '#333333' }}
                  >
                    {cell?.text && <div className="mb-1" dangerouslySetInnerHTML={{ __html: cell.text.replace(/\n/g, '<br />') }} />}
                    {cell?.image && (
                      <img 
                        src={cell.image} 
                        alt={cell.text || 'תמונה בטבלה'}
                        className="max-w-full h-auto max-h-48 object-contain rounded my-1"
                        loading="lazy"
                      />
                    )}
                  </TagName>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}