export default function ReceiptList({ receipts, onEdit, onDelete }) {
  if (receipts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <p className="text-gray-600 text-lg">No receipts yet</p>
        <p className="text-gray-500 text-sm mt-2">
          Add your first receipt to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {receipts.map((receipt) => (
        <div
          key={receipt.id}
          className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {receipt.title}
              </h3>
              <span className="text-2xl font-bold text-primary-600">
                ${parseFloat(receipt.amount).toFixed(2)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium mr-2">Category:</span>
                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs">
                  {receipt.category}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Date:</span>{' '}
                {new Date(receipt.date).toLocaleDateString()}
              </div>
              {receipt.description && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Description:</span>{' '}
                  {receipt.description}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => onEdit(receipt)}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-200"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(receipt.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
